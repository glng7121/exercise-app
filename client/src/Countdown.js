import React, { Component } from 'react';
import { audioBufObj } from './helpers.js';

class Countdown extends Component {
    state = {
      currBreakTime: this.props.breakTime,
      isPaused: false
    }
  
    constructor(props) {
      super(props);
      if (this.isBreakTimeZero(this.props.breakTime)) {
        this.props.endBreak();
      }
      else {
        this.timer = setInterval(this.tick, 1000);
      }
      this.audioBufs = {
        countdowns: [ audioBufObj(null) ]
      };

      for (let i = 1; i <= 5; i++) {
        this.audioBufs.countdowns[i] = audioBufObj(null);
        fetch(`/sounds/countdown-${i}.wav`)
        .then(response => response.arrayBuffer())
        .then(buffer => this.audioBufs.countdowns[i].buffer = buffer);
      }
    }

    componentWillUnmount() {
      clearInterval(this.timer);
    }
  
    togglePause = () => {
      this.setState((prevState) => ({
        isPaused: !prevState.isPaused
      }), () => {
        if (this.state.isPaused) {
          clearInterval(this.timer);
        }
        else {
          this.timer = setInterval(this.tick, 1000);
        }
      });
    }
  
    tick = () => {
      let currMin = this.state.currBreakTime.min;
      let currSec = this.state.currBreakTime.sec;
  
      if (currSec <= 0) {
          currMin--;
          currSec = 59;
      }
      else {
        currSec--;
      }
  
      if (currMin === 0 && currSec === 0) {
        this.props.endBreak();
      }
      else {
        if (currMin === 0 && currSec <= 5) {
          this.props.context.decodeAudioData(this.audioBufs.countdowns[currSec].buffer)
          .then(decodedBuf => {
            let source = this.props.context.createBufferSource();
            source.buffer = decodedBuf;
            source.connect(this.props.context.destination);
            source.start(0);
          })
          .catch(error => {
            console.log(error);
          });
        }
        const newBreakTime = {
          min: currMin,
          sec: currSec
        };
        this.setState((prevState) => ({
          currBreakTime: newBreakTime
        }));
      }
    }
  
    isBreakTimeZero = (breakTime) => {
      return breakTime.min === 0 && breakTime.sec === 0;
    }

    isLastFiveSec = (breakTime) => {
      return breakTime.min === 0 && breakTime.sec <= 5;
    }
  
    render() {
      const formattedMin = (this.state.currBreakTime.min).toLocaleString('en-US', {minimumIntegerDigits: 2});
      const formattedSec = (this.state.currBreakTime.sec).toLocaleString('en-US', {minimumIntegerDigits: 2});
      return (
        <div>
          {`${formattedMin}:${formattedSec}`}
        </div>
      );
      //pausing break button: <button onClick={this.togglePause}> {this.state.isPaused? 'Unpause break' : 'Pause break'} </button>
    }
  }

  export default Countdown;