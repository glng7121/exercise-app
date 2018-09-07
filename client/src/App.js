import React, { Component } from 'react';
import Editor from './Editor.js';
import RunManager from './RunManager.js';
import { Time, storageAvailable } from './helpers.js';
import './App.css';

const NotificationSystem = require('react-notification-system');

function Set(id, reps) {
  this.key = id;
  this.reps = reps;
}

let workout_test = [new Set(0, '25'), 
                    new Set(1, '30'),
                    new Set(2, '45')];

function RunButton(props) {
  return (
    <button id='toggleRunBtn' onClick={props.toggleRun}>
      {props.isRunning? 'Terminate' : 'Run this workout!'}
    </button>
  )
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //currentBaseWorkout: workout_test, //App.generateInitWorkout(), //workout_test,
      currWorkoutID: this.tryCurrWorkoutIdFromStorage(),
      nextWorkoutID: this.tryNextWorkoutIdFromStorage(),
      workouts: this.tryWorkoutsFromStorage(),
      isRunning: false
    }
    this._notificationSystem = React.createRef();
    this.notifStyles = {
      NotificationItem: { // Override the notification item
        DefaultStyle: { // Applied to every notification, regardless of the notification level
          fontSize: '4vw'
        }
      }
    }
  }

  componentDidMount(){
    window.addEventListener('beforeunload', this.populateWorkoutsStorage);
  }

  componentWillUnmount = () => {
    //store workouts into local storage
    window.removeEventListener('beforeunload', this.populateWorkoutsStorage);
  }

  tryCurrWorkoutIdFromStorage() {
    let currWorkoutID;
    if (storageAvailable('localStorage') && (currWorkoutID = localStorage.getItem(App.STORAGE_KEY_CURR_WORKOUT_ID))) {
      return JSON.parse(currWorkoutID);
    } else {
      return 0;
    }
  }

  tryNextWorkoutIdFromStorage() {
    let nextWorkoutID;
    if (storageAvailable('localStorage') && (nextWorkoutID = localStorage.getItem(App.STORAGE_KEY_NEXT_WORKOUT_ID))) {
      return JSON.parse(nextWorkoutID);
    } else {
      return 1;
    }
  }

  tryWorkoutsFromStorage() {
    let storedWorkouts;
    if (storageAvailable('localStorage') && (storedWorkouts = localStorage.getItem(App.STORAGE_KEY_WORKOUTS))) {
      return new Map(JSON.parse(storedWorkouts));
    } else {
      return new Map([[0, this.generateWorkout()]]); //this.generateWorkout(undefined, 'pushups', new Time(0, 3), workout_test.length, workout_test)]]);
    }
  }

  populateWorkoutsStorage = () => {
    if (storageAvailable('localStorage')) {
      localStorage.setItem(App.STORAGE_KEY_WORKOUTS, JSON.stringify(Array.from(this.state.workouts.entries())));
      localStorage.setItem(App.STORAGE_KEY_CURR_WORKOUT_ID, JSON.stringify(this.state.currWorkoutID));
      localStorage.setItem(App.STORAGE_KEY_NEXT_WORKOUT_ID, JSON.stringify(this.state.nextWorkoutID));
    }
  }

  _addNotification = (message, level='success', autoDismissSec=8) => {
    this._notificationSystem.current.addNotification({
      message: message,
      level: level,
      autoDismiss: autoDismissSec,
    });
  }

  // returns a deep clone of the requested workout
  getDeepWorkoutClone = (key) => {
    const workout = this.state.workouts.get(this.state.currWorkoutID);
    if (!workout) return null;
    return this.generateWorkout(workout.name, 
      workout.exercise, 
      new Time(workout.breakTime.min, workout.breakTime.sec), 
      workout.nextSetId, 
      workout.sets.map(s => Object.assign({}, s))); //essentially deep clones the workout
  }

  // updates the requested workout entry in a deep map clone of workouts, and returns the clone.
  // should be used to update the workouts state (as opposed to updating workouts state directly via unintentional referencing. GG me)
  updatedWorkouts = (key, newWorkout) => {
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
    workout.sets.splice(index, 0, new Set(workout.nextSetId, ''));
    workout.nextSetId++;
    this.setState({ workouts: this.updatedWorkouts(this.state.currWorkoutID, workout) });
  }

  deleteSet = (index) => {
    const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
    if (!workout) return;
    workout.sets.splice(index, 1);
    this.setState({ workouts: this.updatedWorkouts(this.state.currWorkoutID, workout) });
  }

  addEmptyWorkout = () => {
    const emptyWorkout = this.generateWorkout();
    const nextWorkoutID = this.state.nextWorkoutID;
    this.setState({ 
      workouts: this.updatedWorkouts(nextWorkoutID, emptyWorkout),
      currWorkoutID: nextWorkoutID,
      nextWorkoutID: nextWorkoutID+1
    })
  }

  deleteCurrWorkout = () => {
    let newWorkouts = new Map(this.state.workouts);
    newWorkouts.delete(this.state.currWorkoutID);
    let nextWorkoutID = this.state.currWorkoutID;
    if (newWorkouts.size === 0) {
      newWorkouts.set(this.state.currWorkoutID, this.generateWorkout());
    } 
    else {
      nextWorkoutID = newWorkouts.keys().next().value;
    }
    this.setState({
      workouts: newWorkouts,
      currWorkoutID: nextWorkoutID
    })
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

  updateWorkoutName = (event) => {
    const workout = this.getDeepWorkoutClone(this.state.currWorkoutID);
    if (!workout) return;
    workout.name = event.target.value;
    this.setState({
      workouts: this.updatedWorkouts(this.state.currWorkoutID, workout)
    });
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
    const workout = this.generateWorkout(oldWorkout.name, undefined, undefined, oldWorkout.nextSetId+1, this.generateEmptySets(oldWorkout.nextSetId)); //keep workout name
    this.setState({
      workouts: this.updatedWorkouts(this.state.currWorkoutID, workout),
      exercise: null,
      breakTime: new Time(null, null)
    });
  }

  generateEmptySets = (id) => {
    return [new Set(id, '')];
  }

  generateWorkout = (name=(new Date()).toString(), exercise=null, breakTime=new Time(null, null), nextSetId=1, sets=this.generateEmptySets(0)) => {
    return {
      name: name,
      exercise: exercise,
      breakTime: breakTime,
      nextSetId: nextSetId,
      sets: sets
    };
  }

  switchWorkouts = (event) => {
    const key = Number(event.target.value);
    if (!this.state.workouts.has(key)) return;
    this.setState({
      currWorkoutID: key
    })
  }

  render() {
    const { workouts, currWorkoutID, isRunning } = this.state;
    const currWorkout = workouts.get(currWorkoutID);
    const currSets = currWorkout? currWorkout.sets : this.generateWorkout().sets;
    const name = currWorkout? currWorkout.name : '';
    const exercise = currWorkout? currWorkout.exercise : '';
    const breakTime = currWorkout? currWorkout.breakTime : '';
    return (
      <div id='appComponent'>
        <h2> 
          {isRunning? 'Currently running workout...' : 'Edit your workout!' }
        </h2>
        <select id='workoutSelector' onChange={this.switchWorkouts} value={currWorkoutID}>
          {Array.from(workouts.entries()).map((pair) => {
            const key = pair[0], workout = pair[1];
            return <option key={key} value={key}>{workout.name}</option>
          })}
        </select>
        {isRunning? <RunManager workoutSets={currSets} 
                                exercise={exercise} 
                                breakTime={this.parseTime(breakTime)} 
                                toggleRun={this.toggleRun} 
                                addNotification={this._addNotification} /> :
                    <Editor key={currWorkoutID}
                            workoutSets={currSets}
                            workoutName={name}
                            exercise={exercise}
                            breakTime={breakTime}
                            updateWorkoutName={this.updateWorkoutName}
                            updateExercise={this.updateExercise}
                            updateBreakMin={this.updateBreakTime_wrapper(App.ID_MIN)}
                            updateBreakSec={this.updateBreakTime_wrapper(App.ID_SEC)}
                            updateSet={this.updateSet} 
                            addEmptySetToBase={this.addEmptySet} 
                            deleteSet={this.deleteSet} 
                            discardAllSets={this.discardAllSets}
                            addNewWorkout={this.addEmptyWorkout}
                            deleteCurrWorkout={this.deleteCurrWorkout} /> }
        <RunButton isRunning={isRunning}
                   toggleRun={this.toggleRun} />
        <NotificationSystem ref={this._notificationSystem} style={this.notifStyles} />
      </div>
    );
  }
}

App.ID_MIN = 'id min';
App.ID_SEC = 'id sec';
App.STORAGE_KEY_WORKOUTS = 'workouts';
App.STORAGE_KEY_CURR_WORKOUT_ID = 'current workout id';
App.STORAGE_KEY_NEXT_WORKOUT_ID = 'next workout id';

export default App;
