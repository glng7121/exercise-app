import React, { Component } from 'react';
import Countdown from './Countdown.js';
import ParsedBreakTime from './ParsedBreakTime.js';
import { parsedBreakTimeStr, audioBufObj } from './helpers.js';
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

      this.apiToken = null;
      this.apiTokenTime = 0;
      this.audioBufs = {
        localSrc: {
          breakSound: audioBufObj(null),
          breakStart: audioBufObj(null),
        },
        remoteSrc: {
          sets: []
        }
      };
      this.isPlaying = false;

      // get audio for workout announcements
      for (let soundType in this.audioBufs.localSrc) {
        const fileName = `${soundType.replace(/([A-Z])/g, ($1) => `-${$1.toLowerCase()}`)}.wav`;
        this.getAudioBuf(this.audioBufs.localSrc[soundType], RunManager.SRC_LOCAL, fileName);
      }
      for (let i = 0; i < this.props.baseWorkout.length; i++) {
        this.audioBufs.remoteSrc.sets[i] = audioBufObj(null);
        const message = i === 0? `Running workout for ${this.props.exercise} with ${parsedBreakTimeStr(this.props.breakTime)} break time.` 
          : '';
        const setType = i === this.props.baseWorkout.length - 1? 'Last' 
          : i === 0? 'First'
          : 'Next';
        const numTries = i === 0? 0 : 5;
        this.getAudioBuf(this.audioBufs.remoteSrc.sets[i], RunManager.SRC_TTS, `${message} ${setType} set: ${this.props.baseWorkout[i].reps} ${this.props.exercise}`, i === 0, numTries);
      }
    }
    catch(e) {
      alert('Web Audio API is not supported in this browser');
    }
  }

  componentWillUnmount = () => {
    context.close().catch(error => console.log(error));
  }

  verifyToken = () => {
    return new Promise((resolve, reject) => {
      if (Date.now() - this.apiTokenTime >= 9*60*1000) { // >= 9 min as ms
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
  getAudioBuf = (saveDest, source, content, shouldPlayAfter = false, numTriesLeft = 2) => {
    if (!context || saveDest.buffer || !content) return;
    
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

    numTriesLeft--;
    getBuf.then(res => {
      saveDest.buffer = res;
      if (shouldPlayAfter) {
        this.playAudioBufs([res]);
      }
    }).catch(error => {
      console.log(error);
      if (numTriesLeft >= 1) {
        console.log('retrying with '+numTriesLeft+' tries left');
        saveDest.timeoutID = setTimeout(this.getAudioBuf, 10000, saveDest, source, content, false, numTriesLeft);
      }
    });
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
  playAudioBufs = (buffers) => {
    if (buffers.length <= 0) return;

    let buffer = buffers.shift();
    if (!buffer) {
      //empty buffer, skip it
      this.playAudioBufs(buffers);
      return;
    }

    context.decodeAudioData(buffer.slice()) //must operate on new copy of buffer since copy will be wiped later
    .then(decodedBuf => {
      let source = context.createBufferSource(); // creates a sound source
      source.onended = function () {
        this.playAudioBufs(buffers);
      }.bind(this);
      source.buffer = decodedBuf;                // tell the source which sound to play
      source.connect(context.destination);       // connect the source to the context's destination (the speakers)
      source.start(0);
    })
    .catch(error => console.log(error));
  }

  endSet = () => {
    if (this.state.currSetIndex === this.props.baseWorkout.length - 1) {
      this.props.toggleRun();
    }
    else {
      //start break time
      let breakStartAudioBufs = [this.audioBufs.localSrc.breakSound.buffer]; //break start beep
      if (this.props.breakTime.min === 0 && this.props.breakTime.sec > 6) {
        //only include break start voiceover if it won't collide with the 5-sec break time countdown 
        breakStartAudioBufs.push(this.audioBufs.localSrc.breakStart.buffer);
      }
      this.playAudioBufs(breakStartAudioBufs);
      this.setState((prevState) => ({
        isBreakTime: true,
        currSetIndex: prevState.currSetIndex + 1
      }));
    }
  }

  endBreak = () => {
    this.playAudioBufs([this.audioBufs.localSrc.breakSound.buffer, this.audioBufs.remoteSrc.sets[this.state.currSetIndex].buffer]);
    //this.apiTest(`Next set: ${this.props.baseWorkout[this.state.currSetIndex].reps} ${this.props.exercise}`);
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
                      
                    {this.props.baseWorkout.map((set, i) => 
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
                              <Countdown breakTime={this.props.breakTime} endBreak={this.endBreak} context={context} />
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

RunManager.API_KEY = '10c95f8e063d489fbb2bb70346bf07af';
RunManager.SRC_TTS = 'text to speech api source';
RunManager.SRC_LOCAL = 'local server source';

export default RunManager;