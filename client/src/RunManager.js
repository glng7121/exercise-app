import React, { Component } from 'react';
import Countdown from './Countdown.js';
import ParsedBreakTime from './ParsedBreakTime.js';
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
    this.apiToken = null;
    this.apiTokenTime = 0;

    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      context = new AudioContext();
    }
    catch(e) {
      alert('Web Audio API is not supported in this browser');
    }
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

  apiTest = (message) => {
    if (!context || !message) return;
    
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

    this.verifyToken().then(() => {
      return axios.request({
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
      });
    })
    .then(response => new Promise((resolve, reject) => {
      context.decodeAudioData(response.data, buffer => resolve(buffer), error => reject(error));
    }))
    .then(buffer => {
      let source = context.createBufferSource(); // creates a sound source
      source.buffer = buffer;                    // tell the source which sound to play
      source.connect(context.destination);       // connect the source to the context's destination (the speakers)
      source.start(0);  
    })
    .catch(error => console.log(error));
  }

  toggleBreakTime = () => {
    if (this.state.currSetIndex === this.props.baseWorkout.length - 1) {
      this.props.toggleRun();
    }
    else {
      this.setState((prevState) => ({
        isBreakTime: true,
        currSetIndex: prevState.currSetIndex + 1
      }));
    }
  }

  endBreak = () => {
    this.apiTest(`Next set: ${this.props.baseWorkout[this.state.currSetIndex].reps} ${this.props.exercise}`);
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
                              <button disabled={isBreakTime} onClick={this.toggleBreakTime}> End Set </button> 
                            </td> 
                            : null }
                          { i === currSetIndex && isBreakTime? 
                            <td>
                              <Countdown breakTime={this.props.breakTime} endBreak={this.endBreak} />
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