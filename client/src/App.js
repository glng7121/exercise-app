import React, { Component } from 'react';
import Editor from './Editor.js';
import RunManager from './RunManager.js';
import WorkoutsManager from './WorkoutsManager.js';
import { Time, storageAvailable } from './helpers.js';
import './App.css';

const NotificationSystem = require('react-notification-system');

function Set(id, reps) {
  this.key = id;
  this.reps = reps;
}

let tonOfSets = [];
for (let i = 0; i < 1000; i++) {
  tonOfSets.push(new Set(i, String(i)));
}

let tonOfWorkouts = new Map();
for (let i = 0; i < 1000; i++) {
  const workout = {
    name: `${i}th workout`,
    exercise: `${i}th exercise`,
    breakTime: new Time(0, 3),
    nextSetId: 1000,
    sets: tonOfSets.map(s => Object.assign({}, s))
  };
  tonOfWorkouts.set(i, workout);
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
    /* reset to default workouts
    this.state = {
      editableWorkout: this.generateWorkout(),
      currWorkoutId: 0,
      nextWorkoutID: 1, 
      workouts: new Map([[0, this.generateWorkout()]]),
      isRunning: false,
      showWorkoutsManager: false
    }
    */
    /* stress testing
    this.state = {
      editableWorkout: tonOfWorkouts.get(0),
      currWorkoutId: 0,
      nextWorkoutID: 1000,
      workouts: tonOfWorkouts,
      isRunning: false,
      showWorkoutsManager: false
    }
    */
    
    const currWorkoutId = this.tryCurrWorkoutIdFromStorage();
    const workouts = this.tryWorkoutsFromStorage();
    this.state = {
      //currentBaseWorkout: workout_test, //App.generateInitWorkout(), //workout_test,
      editableWorkout: this.tryEditableWorkoutFromStorage(workouts, currWorkoutId),
      currWorkoutId: currWorkoutId,
      nextWorkoutID: this.tryNextWorkoutIdFromStorage(),
      workouts: workouts, //tonOfWorkouts,
      isRunning: false,
      showWorkoutsManager: false
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

  componentDidMount = () => {
    window.addEventListener('beforeunload', this.populateWorkoutsStorage);
  }

  componentWillUnmount = () => {
    //store workouts into local storage
    window.removeEventListener('beforeunload', this.populateWorkoutsStorage);
  }

  tryEditableWorkoutFromStorage = (workouts, key) => {
    let editableWorkout;
    if (storageAvailable('localStorage') && (editableWorkout = localStorage.getItem(App.STORAGE_KEY_EDITABLE_WORKOUT))) {
      return JSON.parse(editableWorkout);
    } else {
      return workouts.get(key);
    }
  }

  tryCurrWorkoutIdFromStorage() {
    let currWorkoutId;
    if (storageAvailable('localStorage') && (currWorkoutId = localStorage.getItem(App.STORAGE_KEY_CURR_WORKOUT_ID))) {
      return JSON.parse(currWorkoutId);
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
      localStorage.setItem(App.STORAGE_KEY_CURR_WORKOUT_ID, JSON.stringify(this.state.currWorkoutId));
      localStorage.setItem(App.STORAGE_KEY_NEXT_WORKOUT_ID, JSON.stringify(this.state.nextWorkoutID));
      localStorage.setItem(App.STORAGE_KEY_EDITABLE_WORKOUT, JSON.stringify(this.state.editableWorkout));
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
  getDeepWorkoutClone = (workout) => {
    if (!workout) return null;
    return this.generateWorkout(workout.name, 
      workout.exercise, 
      new Time(workout.breakTime.min, workout.breakTime.sec), 
      workout.nextSetId, 
      workout.sets.map(s => Object.assign({}, s)));
  }

  // updates the requested workout entry in a deep map clone of workouts, and returns the clone.
  // should be used to update the workouts state (as opposed to updating workouts state directly via unintentional referencing. GG me)
  updatedWorkouts = (key, newWorkout) => {
    const oldWorkouts = new Map(this.state.workouts); //shallow map clone
    oldWorkouts.set(key, newWorkout);
    return oldWorkouts;
  }

  updateSet = (event, index) => {
    const workout = this.getDeepWorkoutClone(this.state.editableWorkout);
    if (!workout) return;
    workout.sets[index].reps = event.target.value;
    this.setState({ editableWorkout: workout });
  }

  addEmptySet = (index) => {
    const workout = this.getDeepWorkoutClone(this.state.editableWorkout);
    if (!workout) return;
    workout.sets.splice(index, 0, new Set(workout.nextSetId, ''));
    workout.nextSetId++;
    this.setState({ editableWorkout: workout });
  }

  deleteSet = (index) => {
    const workout = this.getDeepWorkoutClone(this.state.editableWorkout);
    if (!workout) return;
    workout.sets.splice(index, 1);
    this.setState({ editableWorkout: workout });
  }

  addEmptyWorkout = (saveCurrWorkout=true) => {
    let workouts = saveCurrWorkout? 
      this.updatedWorkouts(this.state.currWorkoutId, this.getDeepWorkoutClone(this.state.editableWorkout)) 
      : this.state.workouts;
    const emptyWorkout = this.generateWorkout();
    const nextWorkoutID = this.state.nextWorkoutID;
    workouts.set(nextWorkoutID, emptyWorkout);
    this.setState({ 
      workouts: workouts,
      currWorkoutId: nextWorkoutID,
      editableWorkout: workouts.get(nextWorkoutID),
      nextWorkoutID: nextWorkoutID+1
    });
  }

  deleteCurrWorkout = () => {
    let newWorkouts = new Map(this.state.workouts);
    newWorkouts.delete(this.state.currWorkoutId);
    if (newWorkouts.size === 0) {
      this.setState({ 
        workouts: newWorkouts,
      }, () => {
        this.addEmptyWorkout(false);
      });
    } 
    else {
      const currWorkoutId = newWorkouts.keys().next().value;
      this.setState({
        workouts: newWorkouts,
        currWorkoutId: currWorkoutId,
        editableWorkout: newWorkouts.get(currWorkoutId)
      })
    }
  }

  selectWorkout = (event) => {
    const key = Number(event.target.value);
    if (!this.state.workouts.has(key)) return;
    const updatedWorkouts = this.updatedWorkouts(this.state.currWorkoutId, this.getDeepWorkoutClone(this.state.editableWorkout)); //todo: try removing deep workout clone part?
    this.setState({
      editableWorkout: updatedWorkouts.get(key),
      workouts: updatedWorkouts,
      currWorkoutId: key
    });
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
    const workout = this.state.editableWorkout;
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
      this.setState((prevState) => ({
        isRunning: !prevState.isRunning
      }), () => {
        window.scrollTo(0, 0);
      });
    }
  }

  updateWorkoutName = (event) => {
    const workout = this.getDeepWorkoutClone(this.state.editableWorkout);
    if (!workout) return;
    workout.name = event.target.value;
    this.setState({
      editableWorkout: workout
    });
  }

  updateExercise = (event) => {
    const workout = this.getDeepWorkoutClone(this.state.editableWorkout);
    if (!workout) return;
    workout.exercise = event.target.value;
    this.setState({
      editableWorkout: workout
    });
  }

  updateBreakTime_wrapper = (unit) => {
    return (event) => {
      const workout = this.getDeepWorkoutClone(this.state.editableWorkout);
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
        editableWorkout: workout
      });
    };
  }

  /*
  discardAllSets = () => {
    const oldWorkout = this.state.workouts.get(this.state.currWorkoutId);
    if (!oldWorkout) return;
    const workout = this.generateWorkout(oldWorkout.name, undefined, undefined, oldWorkout.nextSetId+1, this.generateEmptySets(oldWorkout.nextSetId)); //keep workout name
    this.setState({
      workouts: this.updatedWorkouts(this.state.currWorkoutId, workout),
      exercise: null,
      breakTime: new Time(null, null)
    });
  }
  */

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

  render() {
    const { editableWorkout, workouts, currWorkoutId, isRunning, showWorkoutsManager } = this.state;
    const currSets = editableWorkout? editableWorkout.sets : this.generateWorkout().sets;
    const name = editableWorkout? editableWorkout.name : '';
    const exercise = editableWorkout? editableWorkout.exercise : '';
    const breakTime = editableWorkout? editableWorkout.breakTime : '';
    return (
      <div id='appComponent'>
        <h2> 
          {isRunning? 'Currently running workout...' : 'Edit your workout!' }
        </h2>
        {isRunning? <RunManager name={name}
                                workoutSets={currSets} 
                                exercise={exercise} 
                                breakTime={this.parseTime(breakTime)} 
                                toggleRun={this.toggleRun} 
                                addNotification={this._addNotification} /> :
                    <div>
                      <button onClick={() => this.setState((prevState) => ({showWorkoutsManager: !prevState.showWorkoutsManager}))}>
                        {showWorkoutsManager? 'Collapse...' : 'Manage workouts...'}
                      </button>
                      {showWorkoutsManager? 
                        <WorkoutsManager 
                          currWorkoutId={currWorkoutId}
                          currWorkout={editableWorkout}
                          workouts={workouts}
                          addEmptyWorkout={this.addEmptyWorkout} 
                          deleteCurrWorkout={this.deleteCurrWorkout}
                          selectWorkout={this.selectWorkout} /> 
                        : null}
                      <Editor key={currWorkoutId}
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
                            deleteSet={this.deleteSet} />
                    </div> }
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
App.STORAGE_KEY_EDITABLE_WORKOUT = 'editable workout';

export default App;
