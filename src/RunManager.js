import React, { Component } from 'react';
import Countdown from './Countdown.js';
import ParsedBreakTime from './ParsedBreakTime.js';

class RunManager extends Component {
    state = {
      isBreakTime: false,
      currSetIndex: 0,
    }
  
    toggleBreakTime = () => {
      if (this.state.currSetIndex === this.props.baseWorkout.length - 1) {
        this.props.toggleRun();
      }
      else {
        this.setState((prevState) => ({
          isBreakTime: true,
          currSetIndex: prevState.currSetIndex + 1
        }));
      }
    }
  
    endBreak = () => {
      this.setState((prevState) => ({
        isBreakTime: false
      }))
    }
  
    render() {
      const { isBreakTime, currSetIndex } = this.state;
      return (
        <div> 
          Break time: <ParsedBreakTime breakTime={this.props.breakTime} />
          <table>
            <tbody>
              {this.props.baseWorkout.map((set, i) => 
                  <tr key={set.key}> 
                    <td> {`${i+1})`} </td>
                    <td>
                      {`${set.reps} ${this.props.exercise}`} 
                    </td>
                    { i === currSetIndex?
                      <td>
                        <button disabled={isBreakTime} onClick={this.toggleBreakTime}> End This Set </button> 
                      </td> 
                      : null }
                    { i === currSetIndex && isBreakTime? 
                      <td>
                        <Countdown breakTime={this.props.breakTime} endBreak={this.endBreak} />
                      </td> 
                      : null }
                  </tr> )}
            </tbody>
          </table>
        </div>
      );
    }  
  }

export default RunManager;