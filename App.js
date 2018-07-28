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

function Set(reps, exercise) {
  this.key = id(this);
  this.reps = reps;
  //this.exercise = exercise;
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
    <div> {msg} </div>
  );
}

let workout_test = [new Set('25'), 
                    new Set('30'),
                    new Set('45')];

class Editor extends Component {
    constructor(props) {
      super(props);
      let initialRefs = [];
      for (let i = 0; i < this.props.baseWorkout.length; i++) {
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
        this.navigateToNextField(repsRef);
      });
    }

    addEmptySet_wrapper = (index) => {
      return () => {
        this.addEmptySet(index);
      }
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

      if (index+1 === this.state.refs.length) {
        this.addEmptySet(index+1);
      }
      else {
        this.navigateToNextField(this.state.refs[index + 1]);
      }
    }

    handleDeleteSet_wrapper = (index) => {
      return () => {
        const refs = this.state.refs;
        refs.splice(index, 1);
        this.setState({ refs: refs }, () => {
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
        <ol>
          {this.props.baseWorkout.map((set, i) => 
            <div key={set.key}>
              <li> 
                <input className='reps' type='number' placeholder='#' defaultValue={set.reps.toString()}
                      ref={this.state.refs[i]}
                      onChange={this.updateWorkout_wrapper(i)} 
                      onKeyPress={this.handleNextField_wrapper(i)} />
                {' '+(this.props.exercise ? this.props.exercise : '(unknown exercise)')}
                <button className='set-button' onClick={this.handleDeleteSet_wrapper(i)}
                        disabled={i === 0 && this.props.baseWorkout.length === 1? true : false}> 
                  Delete 
                </button>
                <button className='set-button' onClick={this.addEmptySet_wrapper(i+1)}> 
                  Insert After 
                </button>
              </li>
              <li hidden={i+1 === this.props.baseWorkout.length? true : false} > 
                <ParsedBreakTime breakTime={this.props.breakTime} />
              </li>
            </div>
          )}
        </ol>
      );
    }
}

function WorkoutDisplay(props) {
  if (props.isRunning) {
    return (
      <ol>
        {props.baseWorkout.map((set, i) => 
            <div key={set.key}>
              <li> {`${set.reps} ${props.exercise}`} </li>
              <li hidden={i === props.baseWorkout.length - 1}> 
                <ParsedBreakTime breakTime={props.breakTime} />
              </li>
            </div>
        )}
      </ol>
    )
  }
  else {
    return (
      <Editor baseWorkout={props.baseWorkout}
              breakTime={props.breakTime}
              exercise={props.exercise}
              updateWorkout={props.updateWorkout} 
              addEmptySetToBase={props.addEmptySetToBase} 
              deleteSet={props.deleteSet} />
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

class App extends Component {
  state = {
    currentBaseWorkout: workout_test,
    exercise: null,
    breakTime: new Time(0, null), //in secs
    isRunning: false,
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
    return workout.find((set) => isNaN(Number(set.reps)) || Number(set.reps) <= 0);
  }

  toggleRun = () => {
    if (!this.state.isRunning && this.isWorkoutInvalid(this.state.currentBaseWorkout)) {
      alert("Error: at least one reps field is invalid. It's probably empty or a number <= 0. Please fix and try again.");
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

  render() {
    const { currentBaseWorkout, breakTime, isRunning, exercise} = this.state;
    return (
      <div>
        Exercise: <input type='text' placeholder='Exercise' disabled={isRunning} onChange={this.updateExercise} />
        <br />
        Break time: 
        <input type='number' placeholder='minutes' defaultValue={breakTime.min} disabled={isRunning} onChange={this.updateBreakMin} /> minutes
        <input type='number' placeholder='seconds' disabled={isRunning} onChange={this.updateBreakSec} /> seconds
        <WorkoutDisplay baseWorkout={currentBaseWorkout}
                        breakTime={breakTime}
                        isRunning={isRunning}
                        exercise={exercise}
                        updateWorkout={this.updateWorkout} 
                        addEmptySetToBase={this.addEmptySet} 
                        deleteSet={this.deleteSet} />
        <RunButton isRunning={isRunning}
                   toggleRun={this.toggleRun} />
      </div>
    );
  }
}

export default App;
