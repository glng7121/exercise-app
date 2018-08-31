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
    currentBaseWorkout: workout_test, //App.generateInitWorkout(), //workout_test,
    exercise: 'pushups', //null,
    breakTime: new Time(0, 3), //new Time(null, null), 
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

  _addNotification = (message, autoDismissSec=0, level='success') => {
    this._notificationSystem.current.addNotification({
      message: message,
      level: level,
      autoDismiss: autoDismissSec,
    });
  }

  static generateInitWorkout = () => {
    return [new Set('')];
  }

  /*
  insertBreaks = (baseWorkout) => {
    return baseWorkout.reduce((res, curr) => res.concat(curr, new Set(`${this.state.breakTime} seconds`, 'break')), []);
  }
  */

  updateSet = (event, index) => {
    const workout = this.state.currentBaseWorkout;
    workout[index].reps = event.target.value;
    this.setState({ currentBaseWorkout: workout });
  }

  addEmptySet = (index) => {
    const workout = this.state.currentBaseWorkout;
    workout.splice(index, 0, new Set('', ''));
    this.setState({ currentBaseWorkout: workout});
  }

  deleteSet = (index) => {
    const workout = this.state.currentBaseWorkout;
    workout.splice(index, 1);
    this.setState({ currentBaseWorkout: workout});
  }

  isWorkoutInvalid = (workout) => {
    return workout.find((set) => !set.reps || isNaN(Number(set.reps)) || Number(set.reps) < 0);
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
    if (!this.state.isRunning && (!this.state.exercise || !this.isBreakTimeValid(this.state.breakTime) || this.isWorkoutInvalid(this.state.currentBaseWorkout))) {
      alert(`Error: at least one field is invalid. Please note that...
      1. All set fields, the exercise field, and at least one break time field should be filled. 
      2. All numbers should be >= 0. 
Please fix and try again. Thanks!`);
      return;
    }
    else {
      this._addNotification('testing, heres a long message. wowiewflkadsf \n so sweeeeet omg');
      this.setState((prevState) => ({
        isRunning: !prevState.isRunning
      }), () => {
        window.scrollTo(0, 0);
      });
    }
  }

  updateExercise = (event) => {
    this.setState({
      exercise: event.target.value
    });
  }

  updateBreakTime_wrapper = (unit) => {
    return (event) => {
      const newBreakTime = this.state.breakTime;
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
        breakTime: newBreakTime
      });
    };
  }

  discardWorkout = () => {
    this.setState({
      currentBaseWorkout: App.generateInitWorkout(),
      exercise: null,
      breakTime: new Time(null, null)
    });
  }

  render() {
    const { currentBaseWorkout, exercise, breakTime, isRunning } = this.state;
    return (
      <div id='appComponent'>
        <h2> 
          {isRunning? 'Currently running workout...' : 'Edit your workout!' }
        </h2>
        {isRunning? <RunManager baseWorkout={currentBaseWorkout} 
                                exercise={exercise} 
                                breakTime={this.parseTime(breakTime)} 
                                toggleRun={this.toggleRun} /> :
                    <Editor baseWorkout={currentBaseWorkout}
                            breakTime={breakTime}
                            exercise={exercise}
                            updateExercise={this.updateExercise}
                            updateBreakMin={this.updateBreakTime_wrapper(App.ID_MIN)}
                            updateBreakSec={this.updateBreakTime_wrapper(App.ID_SEC)}
                            updateSet={this.updateSet} 
                            addEmptySetToBase={this.addEmptySet} 
                            deleteSet={this.deleteSet} 
                            discardWorkout={this.discardWorkout} /> }
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
