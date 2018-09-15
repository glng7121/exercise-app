import React, { Component } from 'react';
import Countdown from './Countdown.js';
import ParsedBreakTime from './ParsedBreakTime.js';
import { parsedBreakTimeStr, audioBufObj, addSuffixToNum, isBreakTimeZero } from './helpers.js';
import './RunManager.css';
import './workoutDisplay.css';

const xmlbuilder = require('xmlbuilder');
const axios = require('axios');

let context = null; //todo: this.context

class RunManager extends Component {
  state = {
    isBreakTime: false,
    currSetIndex: 0
  }

  constructor(props) {
    super(props);
    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      context = new AudioContext();
    }
    catch(e) {
      this.props.addNotification('Web Audio API is not supported in this browser. Audio has been disabled. Try the latest versions of Chrome, Firefox, or Edge.', 'info', 5);
    }
    
    if (context) {
      this.apiToken = null;
      this.apiTokenTime = 0;
      this.audioBufs = {
        localSrc: {
          breakSound: audioBufObj(null, 'break time buzzer'),
          breakStart: audioBufObj(null, 'break start announcement'),
          breakEndWarning: audioBufObj(null, 'break end warning'),
          countdown: [ audioBufObj(null) ]
        },
        remoteSrc: {
          sets: []
        }
      };
      this.isPlaying = false;

      // get audio for workout announcements
      for (let soundType in this.audioBufs.localSrc) {
        if (soundType === 'countdown') {
          for (let i = 1; i <= 5; i++) {
            this.audioBufs.localSrc.countdown.push(new audioBufObj(null, `${addSuffixToNum(i)} second of the break countdown`));
            this.getAudioBuf(this.audioBufs.localSrc['countdown'][i], RunManager.SRC_LOCAL, `countdown-${i}.wav`);
          }
        }
        else {
          const fileName = `${soundType.replace(/([A-Z])/g, ($1) => `-${$1.toLowerCase()}`)}.wav`;
          this.getAudioBuf(this.audioBufs.localSrc[soundType], RunManager.SRC_LOCAL, fileName);
        }
      }
      for (let i = 0; i < this.props.workoutSets.length; i++) {
        const message = i === 0? `Running workout for ${this.props.exercise} with ${parsedBreakTimeStr(this.props.breakTime)} break time.` 
          : '';
        const setType = i === this.props.workoutSets.length - 1? 'last' 
          : addSuffixToNum(i+1);
        const numTries = i === 0? 0 : 5;
        this.audioBufs.remoteSrc.sets[i] = audioBufObj(null, `${setType} set`);
        this.getAudioBuf(this.audioBufs.remoteSrc.sets[i], RunManager.SRC_TTS, `${message} ${setType} set: ${this.props.workoutSets[i].reps} ${this.props.exercise}`, i === 0, numTries);
      }
    }
  }

  componentWillUnmount = () => {
    context.close().catch(error => console.log(error));
  }

  verifyToken = () => {
    return new Promise((resolve, reject) => {
      if (!context) {
        reject(new Error('audio web api unavailable. should not be attempting this'));
      }
      else if (Date.now() - this.apiTokenTime >= 9*60*1000) { // >= 9 min as ms
        axios.request({
          url: 'https://westus.api.cognitive.microsoft.com/sts/v1.0/issueToken',
          method: 'post',
          headers: {
            'Ocp-Apim-Subscription-Key': RunManager.API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
        })
        .then(response => {
          this.apiToken = response.data;
          this.apiTokenTime = Date.now();
          resolve();
        })
        .catch(error => reject(error));
      }
      else {
        console.log('cached api token');
        resolve();
      }
    });
  }

  // retrieves and saves the requested audio message into @saveDest's 'buffer' property.
  // will attempt this at most @numTriesLeft times, after which it will fail silently.
  // if @shouldPlayAfter is true, will try to play the audio as soon as it's retrieved.
  // (@saveDest must be an object containing a 'buffer' property that's initialized to null)
  getAudioBuf = (saveDest, source, content, shouldPlayAfter = false, numTriesLeft = 5) => {
    if (!context || saveDest.buffer || !content) return;
    
    numTriesLeft--;
    let getBuf;
    switch(source) {
      case RunManager.SRC_TTS:
        getBuf = this.getApiAudioBuf(content);
        break;
      case RunManager.SRC_LOCAL:
        getBuf = new Promise((resolve, reject) => {
          fetch(`/sounds/${content}`)
          .then(response => resolve(response.arrayBuffer()))
          .catch(error => reject(error));
        });
        break;
      default:
        return;
    };

    getBuf.then(res => {
      saveDest.buffer = res;
      if (shouldPlayAfter) {
        this.playAudioBufs([saveDest]);
      }
    }).catch(error => {
      console.log(error);
      if (numTriesLeft >= 1) {
        console.log('retrying with '+numTriesLeft+' tries left');
        saveDest.timeoutID = setTimeout(this.getAudioBuf, 10000, saveDest, source, content, false, numTriesLeft);
      }
      if (shouldPlayAfter) {
        this.playAudioBufs([saveDest]); //playAudioBufs will handle notifying user of error
      }
    }); 
    /* if the edge browser ever supports .finally(), replace above shouldPlayAfter checks with this
    .finally(() => {
      if (shouldPlayAfter) {
        this.playAudioBufs([saveDest]);
    }});
    */
  }

  // returns a promise containing the requested text-to-speech audio as an arraybuffer
  getApiAudioBuf = (message) => {
    const ssmlDoc = xmlbuilder.create('speak')
      .att('version', '1.0')
      .att('xml:lang', 'en-us')
      .ele('voice')
      .att('xml:lang', 'en-us')
      .att('xml:gender', 'Male')
      .att('name', 'Microsoft Server Speech Text to Speech Voice (en-US, Guy24kRUS)')
      .txt(message)
      .end();
    const speakData = ssmlDoc.toString();

    return new Promise((resolve, reject) => {
      this.verifyToken().then(() => 
        axios.request({
          url: 'https://westus.tts.speech.microsoft.com/cognitiveservices/v1',
          method: 'post',
          headers: {
            'Authorization': 'Bearer ' + this.apiToken,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'X-Search-AppId': '07D3234E49CE426DAA29772419F436CA',
            'X-Search-ClientID': '1ECFAE91408841A480F00935DC390960',
          },
          data: speakData,
          responseType: 'arraybuffer'
      }))
      .then(response => {
        resolve(response.data);
      })
      .catch(error => reject(error));
    });
  }

  // recursively plays array of buffers in sequence, starting at index 0. skips empty buffers
  playAudioBufs = (sounds) => {
    if (sounds.length <= 0) return;

    const snd = sounds.shift();
    const buffer = snd.buffer;
    const bufferCheck = new Promise((resolve, reject) => {
      if (!buffer) {
        reject(new Error('null buffer'));
      } else {
        resolve(buffer);
    }})

    bufferCheck.then(buffer => context.decodeAudioData(buffer.slice())) //must operate on new copy of buffer since copy will be wiped later
    .then(decodedBuf => {
      let source = context.createBufferSource(); // creates a sound source
      source.onended = function () {
        this.playAudioBufs(sounds);
      }.bind(this);
      source.buffer = decodedBuf;                // tell the source which sound to play
      source.connect(context.destination);       // connect the source to the context's destination (the speakers)
      source.start(0);
    })
    .catch(error => {
      console.log(error);
      clearTimeout(snd.timeoutID);
      if (snd.reportError) {
        this.props.addNotification(`Error: can't play the audio for the ${snd.name}.`, 'error');
        snd.reportError = false;
      }
      this.playAudioBufs(sounds);
    });
  }

  endSet = () => {
    if (this.state.currSetIndex === this.props.workoutSets.length - 1) {
      this.props.addNotification('Workout complete!', 'success', 3);
      this.props.toggleRun();
    }
    else {
      //start break time
      let breakStartAudioBufs = [];
      if (!isBreakTimeZero(this.props.breakTime)) {
        //only include break start buzzer if it won't collide with the break end buzzer after a 0 break
        breakStartAudioBufs.push(this.audioBufs.localSrc.breakSound);
      }
      if (this.props.breakTime.min === 0 && this.props.breakTime.sec > 6 && this.props.breakTime.sec !== 11) {
        //only include break start voiceover if it won't collide with the 5-sec break time countdown or the 'Get ready' at the 10 sec mark
        breakStartAudioBufs.push(this.audioBufs.localSrc.breakStart);
      }
      this.playAudioBufs(breakStartAudioBufs);
      this.setState((prevState) => ({
        isBreakTime: true,
        currSetIndex: prevState.currSetIndex + 1
      }));
    }
  }

  announceWarning = () => {
    this.playAudioBufs([this.audioBufs.localSrc.breakEndWarning]);
  }

  announceTick = (sec) => {
    if (sec < 1 || sec > 5) return;
    this.playAudioBufs([this.audioBufs.localSrc.countdown[sec]]);
  }

  endBreak = () => {
    this.playAudioBufs([this.audioBufs.localSrc.breakSound, this.audioBufs.remoteSrc.sets[this.state.currSetIndex]]);
    //this.apiTest(`Next set: ${this.props.workoutSets[this.state.currSetIndex].reps} ${this.props.exercise}`);
    this.setState((prevState) => ({
      isBreakTime: false
    }))
  }

  render() {
    const { isBreakTime, currSetIndex } = this.state;
    return (
      <div id='runManagerComponent'> 
        <table className='workout-fields'>
          <tbody>
            <tr>
                <td>
                  <table className='setup-fields'>
                    <tbody>
                      <tr>
                        <td> Name: </td>
                        <td> {this.props.name? this.props.name : '(empty name)'} </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            <tr>
              <td>
                <table className='setup-fields'>
                  <tbody>
                    <tr>
                      <td> Exercise: </td>
                      <td> {this.props.exercise} </td>
                    </tr>
                    <tr>
                      <td> Break time: </td>
                      <td> <ParsedBreakTime breakTime={this.props.breakTime} /> </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table className='set-fields'>
                    <thead>
                      <tr>
                        <th colSpan='4'> Sets </th>
                      </tr>
                    </thead>
                    <tbody>
                      
                    {this.props.workoutSets.map((set, i) => 
                        <tr key={set.key}>
                          <td> {`${i+1})`} </td>
                          <td>
                              {set.reps}
                          </td>
                          { i === currSetIndex?
                            <td>
                              <button disabled={isBreakTime} onClick={this.endSet}> End Set </button> 
                            </td> 
                            : null }
                          { i === currSetIndex && isBreakTime? 
                            <td>
                              <Countdown breakTime={this.props.breakTime} 
                                         endBreak={this.endBreak} 
                                         announceTick={this.announceTick} 
                                         announceWarning={this.announceWarning} />
                            </td> 
                            : null }
                        </tr>
                    )}
                    </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }  
}

RunManager.API_KEY = '3b7d29d214d445308dcae07925a88b63';
RunManager.SRC_TTS = 'text to speech api source';
RunManager.SRC_LOCAL = 'local server source';

export default RunManager;