import React, { Component } from 'react';

class Editor extends Component {
    constructor(props) {
      super(props);
      let initialRefs = [this.props.firstEditorRef]; //will always have at least 1 set
      for (let i = 1; i < this.props.baseWorkout.length; i++) {
        initialRefs.push(React.createRef());
      }
      this.state = { 
        refs: initialRefs 
      };
    }

    handleNextField_wrapper = (index) => {
      return (event) => this.handleNextField(event, index);
    }

    addEmptySet = (index) => {
      //registers a new empty set at index
      this.props.addEmptySetToBase(index);
      const refs = this.state.refs; 
      const repsRef = React.createRef();
      refs.splice(index, 0, repsRef);
      this.setState({ refs: refs }, () => {
        this.props.navigateToNextField(repsRef);
      });
    }

    addEmptySet_wrapper = (index) => {
      return () => {
        this.addEmptySet(index);
      }
    }

    handleNextField = (event, index) => {
      if (event.key !== 'Enter') return;

      if (index+1 === this.state.refs.length) {
        this.addEmptySet(index+1);
      }
      else {
        this.props.navigateToNextField(this.state.refs[index + 1]);
      }
    }

    handleDeleteSet_wrapper = (index) => {
      return () => {
        const refs = this.state.refs;
        refs.splice(index, 1);
        this.setState({ refs: refs }, () => {
          this.props.updateFirstEditorRef(this.state.refs[0]);
          this.props.deleteSet(index);
        });
      }
    }

    updateWorkout_wrapper = (index) => {
      return (event) => {
        this.props.updateWorkout(event, index);
      };
    }

    discardWorkout = () => {
      this.props.discardWorkout();
      this.setState({
        refs: [this.props.firstEditorRef]
      });
    }

    render () {
      return (
        <div>
          <h4> Edit your workout! </h4>
          <button onClick={this.discardWorkout}> Discard Workout </button>
          <table>
            <tbody>
              {this.props.baseWorkout.map((set, i) => 
                <tr key={set.key}>
                  <td> {`${i+1})`} </td>
                  <td>
                    <input className='reps' type='number' placeholder='#' defaultValue={set.reps.toString()}
                          ref={this.state.refs[i]}
                          onChange={this.updateWorkout_wrapper(i)} 
                          onKeyPress={this.handleNextField_wrapper(i)} />
                    {' '+(this.props.exercise ? this.props.exercise : '(unknown exercise)')}
                  </td>
                  <td>
                    <button className='set-button' onClick={this.handleDeleteSet_wrapper(i)}
                            disabled={i === 0 && this.props.baseWorkout.length === 1? true : false}> 
                      Delete 
                    </button>
                  </td>
                  <td>
                    <button className='set-button' onClick={this.addEmptySet_wrapper(i+1)}> 
                      Insert After 
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
}

export default Editor;