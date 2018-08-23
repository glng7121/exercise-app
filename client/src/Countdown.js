import React, { Component } from 'react';

class Countdown extends Component {
    state = {
      currBreakTime: this.props.breakTime,
      isPaused: false,
    }
  
    constructor(props) {
      super(props);
      if (this.isBreakTimeZero(this.props.breakTime)) {
        this.props.endBreak();
      }
      else {
        this.timer = setInterval(this.tick, 1000);
      }
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
        const newBreakTime = {
          min: currMin,
          sec: currSec
        };
        this.setState((prevState) => ({
          currBreakTime: newBreakTime
        }));
      }
    }
  
    componentWillUnmount() {
      clearInterval(this.timer);
    }
  
    isBreakTimeZero = (breakTime) => {
      return breakTime.sec === 0 && breakTime.min === 0;
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