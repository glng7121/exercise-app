import React, { Component } from 'react';
import Countdown from './Countdown.js';
import ParsedBreakTime from './ParsedBreakTime.js';
import { parsedBreakTimeStr } from './helpers.js';
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

  audioBufObj = (buffer) => {
    return { 'buffer': buffer };
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
        breakSound: this.audioBufObj(null),
        breakStart: this.audioBufObj(null),
        sets: []
      };
      this.isPlaying = false;

      // get audio for workout announcements
      fetch('/sounds/break-sound.wav')
        .then(response => response.arrayBuffer())
        .then(buffer => this.audioBufs.breakSound.buffer = buffer);
      fetch('/sounds/break-start.wav')
        .then(response => response.arrayBuffer())
        .then(buffer => this.audioBufs.breakStart.buffer = buffer);

      for (let i = 0; i < this.props.baseWorkout.length; i++) {
        this.audioBufs.sets[i] = this.audioBufObj(null);
        const message = i === 0? `Running workout for ${this.props.exercise} with ${parsedBreakTimeStr(this.props.breakTime)} break time.` 
          : '';
        const setType = i === this.props.baseWorkout.length - 1? 'Last' 
          : i === 0? 'First'
          : 'Next';
        this.getApiAudioBuf(this.audioBufs.sets[i], `${message} ${setType} set: ${this.props.baseWorkout[i].reps} ${this.props.exercise}`, i === 0);
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
    return new Promise(function (resolve, reject) {
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
    }.bind(this));
  }

  // retrieves and saves the requested audio message into saveDest's 'buffer' property.
  // if shouldPlayAfter is true, will try to play the audio as soon as it's retrieved.
  // (saveDest must be an object containing a 'buffer' property that's initialized to null)
  getApiAudioBuf = (saveDest, message, shouldPlayAfter = false) => {
    if (!context || saveDest.buffer || !message) return;
    
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
      })
    )
    .then(response => {
      saveDest.buffer = response.data;
      if (shouldPlayAfter) {
        this.playAudioBufs([response.data]);
      }
    })
    .catch(error => console.log(error));
  }

  //plays array of buffers in sequence, starting at index 0
  playAudioBufs = (buffers) => {
    const buffer = buffers.shift();
    return context.decodeAudioData(buffer.slice()) //must operate on new copy of buffer since copy will be wiped later
    .then(decodedBuf => {
      let source = context.createBufferSource(); // creates a sound source
      source.onended = function () {
        if (buffers.length > 0) {
          this.playAudioBufs(buffers);
        }
      }.bind(this);
      source.buffer = decodedBuf;                // tell the source which sound to play
      source.connect(context.destination);       // connect the source to the context's destination (the speakers)
      source.start(0);
      //this.isPlaying = true;
    })
    .catch(error => console.log(error));
  }

  endSet = () => {
    if (this.state.currSetIndex === this.props.baseWorkout.length - 1) {
      this.props.toggleRun();
    }
    else {
      //start break time
      this.playAudioBufs([this.audioBufs.breakSound.buffer, this.audioBufs.breakStart.buffer]);
      this.setState((prevState) => ({
        isBreakTime: true,
        currSetIndex: prevState.currSetIndex + 1
      }));
    }
  }

  endBreak = () => {
    const nextSetBuf = this.audioBufs.sets[this.state.currSetIndex].buffer;
    if (nextSetBuf) {
      this.playAudioBufs([this.audioBufs.breakSound.buffer, this.audioBufs.sets[this.state.currSetIndex].buffer]);
    }
    else {
      console.log(`Error: set ${this.state.currSetIndex} doesn't have an audio buffer. Skipping its audio`);
    }
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

export default RunManager;