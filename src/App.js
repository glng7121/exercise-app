import React, { Component } from 'react';
import './App.css';

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

let workout_test = [new Set('25'), 
                    new Set('30'),
                    new Set('45')];

class Editor extends Component {
    constructor(props) {
      super(props);
      let initialRefs = [this.props.firstEditorRef]; //will always have at least 1 set
      for (let i = 1; i < this.props.baseWorkout.length; i++) {
        initialRefs.push(React.createRef());
      }
      this.state = { 
        refs: initialRefs 
      };
    }

    handleNextField_wrapper = (index) => {
      return (event) => this.handleNextField(event, index);
    }

    addEmptySet = (index) => {
      //registers a new empty set at index
      this.props.addEmptySetToBase(index);
      const refs = this.state.refs; 
      const repsRef = React.createRef();
      refs.splice(index, 0, repsRef);
      this.setState({ refs: refs }, () => {
        this.props.navigateToNextField(repsRef);
      });
    }

    addEmptySet_wrapper = (index) => {
      return () => {
        this.addEmptySet(index);
      }
    }

    handleNextField = (event, index) => {
      if (event.key !== 'Enter') return;

      if (index+1 === this.state.refs.length) {
        this.addEmptySet(index+1);
      }
      else {
        this.props.navigateToNextField(this.state.refs[index + 1]);
      }
    }

    handleDeleteSet_wrapper = (index) => {
      return () => {
        const refs = this.state.refs;
        refs.splice(index, 1);
        this.setState({ refs: refs }, () => {
          this.props.updateFirstEditorRef(this.state.refs[0]);
          this.props.deleteSet(index);
        });
      }
    }

    updateWorkout_wrapper = (index) => {
      return (event) => {
        this.props.updateWorkout(event, index);
      };
    }

    render () {
      return (
        <div>
          <h4> Edit your workout! </h4>
          <table>
            <tbody>
              {this.props.baseWorkout.map((set, i) => 
                <tr key={set.key}>
                  <td> {`${i+1})`} </td>
                  <td>
                    <input className='reps' type='number' placeholder='#' defaultValue={set.reps.toString()}
                          ref={this.state.refs[i]}
                          onChange={this.updateWorkout_wrapper(i)} 
                          onKeyPress={this.handleNextField_wrapper(i)} />
                    {' '+(this.props.exercise ? this.props.exercise : '(unknown exercise)')}
                  </td>
                  <td>
                    <button className='set-button' onClick={this.handleDeleteSet_wrapper(i)}
                            disabled={i === 0 && this.props.baseWorkout.length === 1? true : false}> 
                      Delete 
                    </button>
                  </td>
                  <td>
                    <button className='set-button' onClick={this.addEmptySet_wrapper(i+1)}> 
                      Insert After 
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
}

function RunButton(props) {
  return (
    <button onClick={props.toggleRun}>
      {props.isRunning? 'Terminate' : 'Run'}
    </button>
  )
}

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

class RunManager extends Component {
  state = {
    isBreakTime: false,
    currSetIndex: 0,
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
    this.setState((prevState) => ({
      isBreakTime: false
    }))
  }

  render() {
    const { isBreakTime, currSetIndex } = this.state;
    return (
      <div> 
        <h4>Currently running...</h4>
        <table>
          <tbody>
            {this.props.baseWorkout.map((set, i) => 
                <tr key={set.key}> 
                  <td> {`${i+1})`} </td>
                  <td>
                    {`${set.reps} ${this.props.exercise}`} 
                  </td>
                  { i === currSetIndex?
                    <td>
                      <button disabled={isBreakTime} onClick={this.toggleBreakTime}> End This Set </button> 
                    </td> 
                    : null }
                  { i === currSetIndex && isBreakTime? 
                    <td>
                      <Countdown breakTime={this.props.breakTime} endBreak={this.endBreak} />
                    </td> 
                    : null }
                </tr> )}
          </tbody>
        </table>
      </div>
    );
  }  
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

  discardWorkout = () => {
    this.setState({
      currentBaseWorkout: App.generateInitWorkout(),
      exercise: null,
      breakTime: new Time(0, null), 
    });
  }

  static generateInitWorkout = () => {
    return [new Set('')];
  }

  render() {
    const { currentBaseWorkout, exercise, breakTime, isRunning, firstEditorRef } = this.state;
    //<button onClick={this.discardWorkout}> Discard Workout </button>
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
                            navigateToNextField={this.navigateToNextField} /> }
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
