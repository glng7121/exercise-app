import React, { Component } from 'react';
import './WorkoutsManager.css';

class WorkoutsManager extends Component {
  render() {
      return (
        <div id='workoutsManagerComponent'>
          <div className='button-menu'>
            <button onClick={this.props.addEmptyWorkout}> New </button>
            <button onClick={this.props.deleteCurrWorkout}> Delete </button>
          </div>
          <select id='workoutSelector' onChange={this.props.selectWorkout} value={this.props.currWorkoutId}>
          {Array.from(this.props.workouts.entries()).map((pair) => {
            const key = pair[0];
            const workout = (key === this.props.currWorkoutId? this.props.currWorkout : pair[1]);
            return <option key={key} value={key}>{workout.name? workout.name : '(invalid name)'}</option>
          })}
        </select>
        </div>
      )
  }
}

export default WorkoutsManager;