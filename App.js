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

    handleNextField = (event, index, field) => {
      if (event.key !== 'Enter') return;
      if (field === EXER_FIELD_NAME && (index+1)*2 === this.state.refs.length) {
        this.props.addEmptySet();
        const refs = this.state.refs; 
        const repsRef = React.createRef();
        refs.push(repsRef, React.createRef());
        this.setState({ refs: refs }, () => {
          repsRef.current.select();
        });
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

    render () {
      return (
        <ol>
          {this.props.baseWorkout.map((Set, i) => 
            <div key={Set.key}>
              <li> 
                <input className='reps' type='text' placeholder='#' defaultValue={Set.reps.toString()}
                      ref={this.state.refs[i*2]}
                      onChange={this.props.updateWorkout(i, REPS_FIELD_NAME)} 
                      onKeyPress={this.handleNextField_wrapper(i, REPS_FIELD_NAME)} />
                <input className='exercise' type='text' placeholder='exercise' defaultValue={Set.exercise} 
                      ref={this.state.refs[i*2 + 1]}
                      onChange={this.props.updateWorkout(i, EXER_FIELD_NAME)} 
                      onKeyPress={this.handleNextField_wrapper(i, EXER_FIELD_NAME)} />
                <button onClick={this.handleDeleteSet_wrapper(i)}> Delete </button>
              </li>
              <li hidden={i+1 === this.props.baseWorkout.length? true : false} > 
                {`${this.props.breakTime} seconds`} 
              </li>
            </div>
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

  /*
  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }
  */

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

  addEmptySet = () => {
    const workout = this.state.currentBaseWorkout;
    workout.push(new Set('', ''));
    this.setState({ currentBaseWorkout: workout});
  }

  deleteSet = (index) => {
    //index is with respect to the base workout
    const workout = this.state.currentBaseWorkout;
    workout.splice(index, 1);
    this.setState({ currentBaseWorkout: workout});
  }

  render() {
    const { currentBaseWorkout, breakTime } = this.state;
    return (
      <div>
        <Editor baseWorkout={currentBaseWorkout}
                breakTime={breakTime}
                updateWorkout={this.updateWorkout_wrapper} 
                addEmptySet={this.addEmptySet} 
                deleteSet={this.deleteSet} />
      </div>
    );
  }
}

export default App;
