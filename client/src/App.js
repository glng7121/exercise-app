import React, { Component } from 'react';
import Editor from './Editor.js';
import RunManager from './RunManager.js';
import './App.css';

const NotificationSystem = require('react-notification-system');

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
    //currentBaseWorkout: workout_test, //App.generateInitWorkout(), //workout_test,
    currWorkoutID: 0,
    maxWorkoutID: 0,
    workouts: new Map([[0, App.generateWorkout(undefined, 'pushups', new Time(0, 3), workout_test)]]),
    isRunning: false
  }

  constructor(props) {
    super(props);
    this._notificationSystem = React.createRef();
    this.notifStyles = {
      NotificationItem: { // Override the notification item
        DefaultStyle: { // Applied to every notification, regardless of the notification level
          fontSize: '4vw'
        }
      }
    }
  }

  _addNotification = (message, level='success', autoDismissSec=8) => {
    this._notificationSystem.current.addNotification({
      message: message,
      level: level,
      autoDismiss: autoDismissSec,
    });
  }

  static generateWorkout = (name=(new Date()).toString(), exercise=null, breakTime=new Time(null, null), sets=[new Set('')]) => {
    return {
      name: name,
      exercise: exercise,
      breakTime: breakTime,
      sets: sets
    };
  }

  /*
  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }
  */

  // returns a deep clone of the requested workout
  getDeepWorkoutClone = (key) => {
    const workout = this.state.workouts.get(this.state.currWorkoutID);
    if (!workout) return null;
    return App.generateWorkout(workout.name, workout.sets.map(s => Object.assign({}, s))); //essentially deep clones the workout
  }

  // updates the requested workout entry in a deep map clone of workouts, and returns the clone.
  // should be used to update the workouts state (as opposed to updating workouts state directly via unintentional referencing. GG me)
  updatedWorkouts = (key, newWorkout) => {
    if (!this.state.workouts.has(key)) return null;
    const oldWorkouts = new Map(this.state.workouts); //shallow map clone
    oldWorkouts.set(key, newWorkout);
    return oldWorkouts;
  }

  updateSet = (event, index) => {
    const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
    if (!workout) return;
    workout.sets[index].reps = event.target.value;
    this.setState({ workouts: this.updatedWorkouts(this.state.currWorkoutID, workout) });
  }

  addEmptySet = (index) => {
    const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
    if (!workout) return;
    workout.sets.splice(index, 0, new Set('', ''));
    this.setState({ workouts: this.updatedWorkouts(this.state.currWorkoutID, workout) });
  }

  deleteSet = (index) => {
    const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
    if (!workout) return;
    workout.sets.splice(index, 1);
    this.setState({ workouts: this.updatedWorkouts(this.state.currWorkoutID, workout) });
  }

  isWorkoutInvalid = (workout) => {
    return !workout || workout.sets.find((set) => !set.reps || isNaN(Number(set.reps)) || Number(set.reps) < 0);
  }

  isBreakTimeValid = (breakTime) => {
    return !(breakTime.min === null && breakTime.sec === null)
           && breakTime.min >= 0 && breakTime.sec >= 0; //if null, still behaves as expected
  }

  parseTime = (time) => {
    //no validation checks here!
    const min = Number(time.min) + Math.floor(Number(time.sec)/60);
    const sec = Number(time.sec) % 60;
    return new Time(min, sec);
  }

  toggleRun = () => {
    const workout = this.state.workouts.get(this.state.currWorkoutID);
    if (!this.state.isRunning && (this.isWorkoutInvalid(workout)
                                  || !workout.exercise
                                  || !this.isBreakTimeValid(workout.breakTime))) {
      alert(`Error: at least one field is invalid. Please note that...
      1. All set fields, the exercise field, and at least one break time field should be filled. 
      2. All numbers should be >= 0. 
Please fix and try again. Thanks!`);
      return;
    }
    else {
      //this._addNotification('testing, heres a long message. wowiewflkadsf \n so sweeeeet omg');
      this.setState((prevState) => ({
        isRunning: !prevState.isRunning
      }), () => {
        window.scrollTo(0, 0);
      });
    }
  }

  updateExercise = (event) => {
    const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
    if (!workout) return;
    workout.exercise = event.target.value;
    this.setState({
      workouts: this.updatedWorkouts(this.state.currWorkoutID, workout)
    });
  }

  updateBreakTime_wrapper = (unit) => {
    return (event) => {
      const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
      if (!workout) return;
      const newBreakTime = workout.breakTime;
      const newUnitStr = event.target.value;
      const newUnit = Number(newUnitStr);

      switch (unit) {
        case App.ID_MIN:
          if (newUnitStr) newBreakTime.min = newUnit;
          else newBreakTime.min = null;
          break;
        case App.ID_SEC:
          if (newUnitStr) newBreakTime.sec = newUnit;
          else newBreakTime.sec = null;
          break;
        default:
          return;
      }

      this.setState({
        workouts: this.updatedWorkouts(this.state.currWorkoutID, workout)
      });
    };
  }

  discardAllSets = () => {
    const oldWorkout = this.state.workouts.get(this.state.currWorkoutID);
    if (!oldWorkout) return;
    const workout = App.generateWorkout(oldWorkout.name); //keep workout name
    this.setState({
      workouts: this.updatedWorkouts(this.state.currWorkoutID, workout),
      exercise: null,
      breakTime: new Time(null, null)
    });
  }

  render() {
    const { workouts, currWorkoutID, isRunning } = this.state;
    const currWorkout = workouts.get(currWorkoutID);
    const currSets = currWorkout? currWorkout.sets : App.generateWorkout().sets;
    const exercise = currWorkout? currWorkout.exercise : '';
    const breakTime = currWorkout? currWorkout.breakTime : '';
    return (
      <div id='appComponent'>
        <h2> 
          {isRunning? 'Currently running workout...' : 'Edit your workout!' }
        </h2>
        {isRunning? <RunManager workoutSets={currSets} 
                                exercise={exercise} 
                                breakTime={this.parseTime(breakTime)} 
                                toggleRun={this.toggleRun} 
                                addNotification={this._addNotification} /> :
                    <Editor workoutSets={currSets}
                            breakTime={breakTime}
                            exercise={exercise}
                            updateExercise={this.updateExercise}
                            updateBreakMin={this.updateBreakTime_wrapper(App.ID_MIN)}
                            updateBreakSec={this.updateBreakTime_wrapper(App.ID_SEC)}
                            updateSet={this.updateSet} 
                            addEmptySetToBase={this.addEmptySet} 
                            deleteSet={this.deleteSet} 
                            discardAllSets={this.discardAllSets} /> }
        <RunButton isRunning={isRunning}
                   toggleRun={this.toggleRun} />
        <NotificationSystem ref={this._notificationSystem} style={this.notifStyles} />
      </div>
    );
  }
}

App.ID_MIN = 'id min';
App.ID_SEC = 'id sec';

export default App;
