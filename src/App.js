import React, { Component } from 'react';
import Editor from './Editor.js';
import RunManager from './RunManager.js';
import './App.css';

//id function from https://stackoverflow.com/a/43963612
const id = (() => {
  let currentId = 0;
  const map = new WeakMap();

  return (object) => {
      if (!map.has(object)) {
          map.set(object, ++currentId);
      }

      return map.get(object);
  };
})();

function Time(min, sec) {
  this.min = min;
  this.sec = sec;
}

function Set(reps) {
  this.key = id(this);
  this.reps = reps;
}

let workout_test = [new Set('25'), 
                    new Set('30'),
                    new Set('45')];

function RunButton(props) {
  return (
    <button id='toggleRunBtn' onClick={props.toggleRun}>
      {props.isRunning? 'Terminate' : 'Run this workout!'}
    </button>
  )
}

class App extends Component {
  state = {
    currentBaseWorkout: App.generateInitWorkout(), //workout_test,
    exercise: null,
    breakTime: new Time(0, null), 
    isRunning: false
  }

  static generateInitWorkout = () => {
    return [new Set('')];
  }

  /*
  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }
  */

  updateSet = (event, index) => {
    const workout = this.state.currentBaseWorkout;
    workout[index].reps = event.target.value;
    this.setState({ currentBaseWorkout: workout });
  }

  addEmptySet = (index) => {
    const workout = this.state.currentBaseWorkout;
    workout.splice(index, 0, new Set('', ''));
    this.setState({ currentBaseWorkout: workout});
  }

  deleteSet = (index) => {
    const workout = this.state.currentBaseWorkout;
    workout.splice(index, 1);
    this.setState({ currentBaseWorkout: workout});
  }

  isWorkoutInvalid = (workout) => {
    return workout.find((set) => !set.reps || isNaN(Number(set.reps)) || Number(set.reps) < 0);
  }

  isBreakTimeValid = (breakTime) => {
    return breakTime.min !== null && breakTime.min >= 0 && breakTime.sec !== null && breakTime.sec >= 0 && breakTime.sec <= 59;
  }

  toggleRun = () => {
    if (!this.state.isRunning && (!this.state.exercise || !this.isBreakTimeValid(this.state.breakTime) || this.isWorkoutInvalid(this.state.currentBaseWorkout))) {
      alert("Error: at least one field is invalid. No field should be empty, all numbers should be >= 0, and the # of seconds should be <= 59. Please fix and try again.");
      return;
    }
    else {
      this.setState((prevState) => ({
        isRunning: !prevState.isRunning
      }), () => {
        window.scrollTo(0, 0);
      });
    }
  }

  updateExercise = (event) => {
    this.setState({
      exercise: event.target.value
    });
  }

  updateBreakMin = (event) => {
    const newBreakTime = this.state.breakTime;
    const newMinStr = event.target.value;
    const newMin = Number(newMinStr);

    if (newMinStr && newMin >= 0) {
      newBreakTime.min = newMin;
    }
    else {
      newBreakTime.min = null;
    }
    
    this.setState({
      breakTime: newBreakTime
    });
  }

  updateBreakSec = (event) => {
    const newBreakTime = this.state.breakTime;
    const newSecStr = event.target.value;
    const newSec = Number(newSecStr);

    if (newSecStr && newSec >= 0 && newSec <= 59) {
      newBreakTime.sec = newSec;
    }
    else {
      newBreakTime.sec = null;
    }
    
    this.setState({
      breakTime: newBreakTime
    });
  }

  discardWorkout = () => {
    this.setState({
      currentBaseWorkout: App.generateInitWorkout(),
      exercise: null,
      breakTime: new Time(0, null)
    });
  }

  render() {
    const { currentBaseWorkout, exercise, breakTime, isRunning } = this.state;
    return (
      <div id='appComponent'>
        <h1> 
          {isRunning? 'Currently running workout...' : 'Edit your workout!' }
        </h1>
        {isRunning? <RunManager baseWorkout={currentBaseWorkout} 
                                exercise={exercise} 
                                breakTime={breakTime} 
                                toggleRun={this.toggleRun} /> :
                    <Editor baseWorkout={currentBaseWorkout}
                            breakTime={breakTime}
                            exercise={exercise}
                            updateExercise={this.updateExercise}
                            updateBreakMin={this.updateBreakMin}
                            updateBreakSec={this.updateBreakSec}
                            updateSet={this.updateSet} 
                            addEmptySetToBase={this.addEmptySet} 
                            deleteSet={this.deleteSet} 
                            discardWorkout={this.discardWorkout} /> }
        <RunButton isRunning={isRunning}
                   toggleRun={this.toggleRun} />
      </div>
    );
  }
}

export default App;
