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

/*
function ParsedBreakTime(props) {
  const { min, sec } = props.breakTime;
  let msg = '';

  if (min || min === 0) {
    if (min !== 0) {
      msg += min.toString() + ' minutes ';
    }
  }
  else {
    msg += '(invalid minutes) ';
  }
  
  if (sec || sec === 0) {
    msg += sec.toString() + ' seconds';
  }
  else {
    msg += '(invalid seconds)';
  }

  return (
    <span> {msg} break </span>
  );
}
*/

let workout_test = [new Set('25'), 
                    new Set('30'),
                    new Set('45')];

function RunButton(props) {
  return (
    <button onClick={props.toggleRun}>
      {props.isRunning? 'Terminate' : 'Run'}
    </button>
  )
}

class App extends Component {
  state = {
    currentBaseWorkout: App.generateInitWorkout(), //workout_test,
    exercise: null,
    breakTime: new Time(0, null), 
    isRunning: false,
    firstEditorRef: React.createRef()
  }

  constructor(props) {
    super(props);
    this.setupRefs = []; //stores refs for workout setup: exercise, min/sec of breaktime
    for (let i = 0; i < 3; i++) {
      this.setupRefs.push(React.createRef());
    }
  }

  /*
  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }
  */

  updateWorkout = (event, index) => {
    const workout = this.state.currentBaseWorkout;
    workout[index].reps = event.target.value;
    this.setState({ currentBaseWorkout: workout });
    //console.log(this.state.currentBaseWorkout[index]);
  }

  addEmptySet = (index) => {
    const workout = this.state.currentBaseWorkout;
    //workout.push(new Set('', ''));
    workout.splice(index, 0, new Set('', ''));
    this.setState({ currentBaseWorkout: workout});
  }

  deleteSet = (index) => {
    //index is with respect to the base workout
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
      }));
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

  navigateToNextField = (ref) => {
    ref.current.select();
    const viewportOffset = ref.current.getBoundingClientRect(); //coords are w.r.t. current viewport
    if (viewportOffset.top < 0 || viewportOffset.bottom > window.innerHeight) {
      window.scrollTo(0, ref.current.offsetTop);
    }
  }

  handleNextField = (event, index) => {
    if (event.key !== 'Enter') return;

    let nextRef = null;
    if (index+1 === this.setupRefs.length) {
      nextRef = this.state.firstEditorRef;
    }
    else {
      nextRef = this.setupRefs[index + 1];
    }

    this.navigateToNextField(nextRef);
  }

  handleNextField_wrapper = (index) => {
    return (event) => this.handleNextField(event, index);
  }

  updateFirstEditorRef = (ref) => {
    this.setState({
      firstEditorRef: ref
    });
  }

  static generateInitWorkout = () => {
    return [new Set('')];
  }

  discardWorkout = () => {
    //not changing exercise and break time for now
    this.setState({
      currentBaseWorkout: App.generateInitWorkout(),
    });
  }

  render() {
    const { currentBaseWorkout, exercise, breakTime, isRunning, firstEditorRef } = this.state;
    return (
      <div>
        Exercise: <input type='text' placeholder='Exercise' defaultValue={exercise} disabled={isRunning} ref={this.setupRefs[App.EXER_IND]} 
                         onChange={this.updateExercise} 
                         onKeyPress={this.handleNextField_wrapper(App.EXER_IND)} />
        <br />
        Break time: 
        <input type='number' placeholder='minutes' defaultValue={breakTime.min} disabled={isRunning} ref={this.setupRefs[App.BREAK_MIN_IND]} 
               onChange={this.updateBreakMin} 
               onKeyPress={this.handleNextField_wrapper(App.BREAK_MIN_IND)} /> minutes
        <input type='number' placeholder='seconds' defaultValue={breakTime.sec} disabled={isRunning} ref={this.setupRefs[App.BREAK_SEC_IND]} 
               onChange={this.updateBreakSec} 
               onKeyPress={this.handleNextField_wrapper(App.BREAK_SEC_IND)} /> seconds
        {isRunning? <RunManager baseWorkout={currentBaseWorkout} 
                                exercise={exercise} 
                                breakTime={breakTime} 
                                toggleRun={this.toggleRun} /> :
                    <Editor baseWorkout={currentBaseWorkout}
                            breakTime={breakTime}
                            exercise={exercise}
                            firstEditorRef={firstEditorRef}
                            updateWorkout={this.updateWorkout} 
                            addEmptySetToBase={this.addEmptySet} 
                            deleteSet={this.deleteSet} 
                            updateFirstEditorRef={this.updateFirstEditorRef}
                            navigateToNextField={this.navigateToNextField} 
                            discardWorkout={this.discardWorkout} /> }
        <br />
        <RunButton isRunning={isRunning}
                   toggleRun={this.toggleRun} />
      </div>
    );
  }
}

App.EXER_IND = 0;
App.BREAK_MIN_IND = 1;
App.BREAK_SEC_IND = 2;

export default App;
