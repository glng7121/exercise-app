import React, { Component } from 'react';
import './App.css';

const REPS_FIELD_NAME = 'reps';
const EXER_FIELD_NAME = 'exercise';

function Set(reps, exercise) {
  this.reps = reps;
  this.exercise = exercise;
}

let workout_test = [new Set(25, "pushups"), 
                    new Set(30, "situps"),
                    new Set(45, "pushups")];

class Editor extends Component {
    state = {
      refs: [],
    };

    render () {
      return (
        <ol>
          {this.props.workout.map((Set, i) => 
            <li key={i}> 
              <input className='reps' type='text' placeholder='#' defaultValue={Set.reps.toString()}
                    key={`${i}_r`} onChange={this.props.updateWorkout(i, REPS_FIELD_NAME)} />
              <input className='exercise' type='text' placeholder='exercise' defaultValue={Set.exercise} 
                    key={`${i}_e`} onChange={this.props.updateWorkout(i, EXER_FIELD_NAME)} />
            </li>
          )}
        </ol>
      );
    }
}

class App extends Component {
  state = {
    currentBaseWorkout: workout_test,
    breakTime: 45, //in secs
  }

  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }

  updateWorkout_wrapper = (index, field) => {
    return (event) => {
      this.updateWorkout(event, index, field);
    };
  }

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

  render() {
    const { currentBaseWorkout, breakTime } = this.state;
    return (
      <div>
        <Editor workout={this.insertBreaks(currentBaseWorkout)}
                updateWorkout={this.updateWorkout_wrapper} />
      </div>
    );
  }
}

export default App;
