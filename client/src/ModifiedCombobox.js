import React, { Component } from 'react';
import Combobox from 'react-widgets/lib/Combobox';
import 'react-widgets/dist/css/react-widgets.css';
import './ModifiedCombobox.css';

class ModifiedCombobox extends Component {
  state = {
    isOpen: false
  };

  constructor(props) {
    super(props);
    this.stayClosedFlag = false;
  }

  selectWorkout = (workout) => {
    if (workout.key === this.props.currWorkoutId) return;
    this.props.selectWorkout(workout.key);
  }

  onChange = (value) => {
    //don't update name if onChange was triggered by selecting a workout, which would make @value a workout.
    if (!value.hasOwnProperty('name')) {
      this.props.updateName(value);
    }
    this.stayClosedFlag = true;
    this.setState({
      isOpen: false
    }, () => {
      this.stayClosedFlag = false;
    })
  }

  onToggle = (value) => {
    if (this.stayClosedFlag) {
      this.stayClosedFlag = false;
    } else {
      this.setState({
        isOpen: value
      })
    }
  }

  render() {
    const workoutsArr = Array.from(this.props.workouts.entries()).map((pair) => {
      const workout = (pair[0] === this.props.currWorkoutId? this.props.currWorkout : pair[1]);
      return workout;
    });
    return (
      <div id='ModifiedComboboxComponent'>
        <Combobox 
          containerClassName='name-field'
          data={workoutsArr} 
          open={this.state.isOpen}
          valueField='key'
          textField='name'
          defaultValue={this.props.currWorkoutId}
          onToggle={this.onToggle}
          onChange={this.onChange}
          onSelect={this.selectWorkout}/>
      </div>
    );
  }
}

export default ModifiedCombobox;