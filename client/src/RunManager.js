import React, { Component } from 'react';
import Countdown from './Countdown.js';
import ParsedBreakTime from './ParsedBreakTime.js';
import './RunManager.css';
import './workoutDisplay.css';

let context = null;
function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
  }
  return ab;
}

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
        alert('Web Audio API is not supported in this browser');
      }
    }

    apiTest = (msg) => {
      if (!context) return;
      fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({message: msg})
      })
      .then(data => data.json())
      .then(body => new Promise((resolve, reject) => {
        console.log(body.sound);
        context.decodeAudioData(toArrayBuffer(body.sound.data), 
          (buffer) => resolve(buffer), (error) => reject(error));
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

export default RunManager;