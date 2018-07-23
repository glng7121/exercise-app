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
    constructor(props) {
      super(props);
      let initialRefs = [];
      for (let i = 0; i < this.props.workout.length*2; i++) {
        initialRefs.push(React.createRef());
      }
      this.state = { refs: initialRefs };
      console.log(this.state.refs);
    }

    handleNextField_wrapper = (index, field) => {
      return (event) => this.handleNextField(event, index, field);
    }

    handleNextField = (event, index, field) => {
      if (event.key !== 'Enter') return;
      if (field === EXER_FIELD_NAME && (index+1)*2 === this.state.refs.length) {
        //this.props.addSet();
        return;
      }
      const currRefIndex = field === REPS_FIELD_NAME ? index*2 :
                        field === EXER_FIELD_NAME ? index*2 + 1 :
                        null;
      //console.log(this.state.refs[currRefIndex + 1].current);
      this.state.refs[currRefIndex + 1].current.select();
    }

    render () {
      return (
        <ol>
          {this.props.workout.map((Set, i) => 
            <li key={i}> 
              <input className='reps' type='text' placeholder='#' defaultValue={Set.reps.toString()}
                    ref={this.state.refs[i*2]} key={`${i*2}`} 
                    onChange={this.props.updateWorkout(i, REPS_FIELD_NAME)} 
                    onKeyPress={this.handleNextField_wrapper(i, REPS_FIELD_NAME)} />
              <input className='exercise' type='text' placeholder='exercise' defaultValue={Set.exercise} 
                    ref={this.state.refs[i*2 + 1]} key={`${i*2 + 1}`} 
                    onChange={this.props.updateWorkout(i, EXER_FIELD_NAME)} 
                    onKeyPress={this.handleNextField_wrapper(i, EXER_FIELD_NAME)} />
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
    console.log(this.state.currentBaseWorkout[index]);
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
