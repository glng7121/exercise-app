import React, { Component } from 'react';
import './App.css';

const REPS_FIELD_NAME = 'reps';
const EXER_FIELD_NAME = 'exercise';

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

function Set(reps, exercise) {
  this.key = id(this);
  this.reps = reps;
  this.exercise = exercise;
}

let workout_test = [new Set(25, "pushups"), 
                    new Set(30, "situps"),
                    new Set(45, "pushups")];

class Editor extends Component {
    constructor(props) {
      super(props);
      let initialRefs = [];
      for (let i = 0; i < this.props.baseWorkout.length*2; i++) {
        initialRefs.push(React.createRef());
      }
      this.state = { 
        refs: initialRefs 
      };
    }

    handleNextField_wrapper = (index, field) => {
      return (event) => this.handleNextField(event, index, field);
    }

    addEmptySet = (index) => {
      //registers a new empty set at index
      this.props.addEmptySetToBase(index);
      const refs = this.state.refs; 
      const repsRef = React.createRef();
      refs.splice(index*2, 0, repsRef, React.createRef());
      this.setState({ refs: refs }, () => {
        repsRef.current.select();
      });
    }

    addEmptySet_wrapper = (index) => {
      return () => {
        this.addEmptySet(index);
      }
    }

    handleNextField = (event, index, field) => {
      if (event.key !== 'Enter') return;
      if (field === EXER_FIELD_NAME && (index+1)*2 === this.state.refs.length) {
        this.addEmptySet(index+1);
        return;
      }
      const currRefIndex = field === REPS_FIELD_NAME ? index*2 :
                           field === EXER_FIELD_NAME ? index*2 + 1 :
                           null;
      //console.log(this.state.refs[currRefIndex + 1].current);
      this.state.refs[currRefIndex + 1].current.select();
    }

    handleDeleteSet_wrapper = (index) => {
      return () => {
        const refs = this.state.refs;
        refs.splice(index*2, 2);
        this.setState({ refs: refs }, () => {
          this.props.deleteSet(index);
        });
      }
    }

    updateWorkout_wrapper = (index, field) => {
      return (event) => {
        this.props.updateWorkout(event, index, field);
      };
    }

    render () {
      return (
        <ol>
          {this.props.baseWorkout.map((set, i) => 
            <div key={set.key}>
              <li> 
                <input className='reps' type='text' placeholder='#' defaultValue={set.reps.toString()}
                      ref={this.state.refs[i*2]}
                      onChange={this.updateWorkout_wrapper(i, REPS_FIELD_NAME)} 
                      onKeyPress={this.handleNextField_wrapper(i, REPS_FIELD_NAME)} />
                <input className='exercise' type='text' placeholder='exercise' defaultValue={set.exercise} 
                      ref={this.state.refs[i*2 + 1]}
                      onChange={this.updateWorkout_wrapper(i, EXER_FIELD_NAME)} 
                      onKeyPress={this.handleNextField_wrapper(i, EXER_FIELD_NAME)} />
                <button onClick={this.handleDeleteSet_wrapper(i)}
                        disabled={i === 0 ? true : false}> 
                  Delete 
                </button>
                <button onClick={this.addEmptySet_wrapper(i+1)}> 
                  Insert After 
                </button>
              </li>
              <li hidden={i+1 === this.props.baseWorkout.length? true : false} > 
                {`${this.props.breakTime} second break`} 
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
              <li> {`${set.reps} ${set.exercise}`} </li>
              <li hidden={i === props.baseWorkout.length - 1}> 
                {`${props.breakTime} second break`} 
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
    breakTime: 45, //in secs
    isRunning: false,
  }

  /*
  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }
  */

  updateWorkout = (event, index, field) => {
    const workout = this.state.currentBaseWorkout;
    if (field === REPS_FIELD_NAME) {
      workout[index].reps = event.target.value;
    }
    else if (field === EXER_FIELD_NAME) {
      workout[index].exercise = event.target.value;
    }
    else {
      return;
    }
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
    return workout.find((set) => set.reps === '' || set.exercise === '' || isNaN(Number(set.reps)) || Number(set.reps) <= 0);
  }

  toggleRun = () => {
    if (!this.state.isRunning && this.isWorkoutInvalid(this.state.currentBaseWorkout)) {
      alert("Error: at least one field is invalid. It may be empty, or not a number if it's a reps field. Please fix and try again");
      return;
    }
    else {
      this.setState((prevState) => ({
        isRunning: !prevState.isRunning
      }));
    }
  }

  render() {
    const { currentBaseWorkout, breakTime, isRunning } = this.state;
    return (
      <div>
        <WorkoutDisplay baseWorkout={currentBaseWorkout}
                        breakTime={breakTime}
                        isRunning={isRunning}
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
