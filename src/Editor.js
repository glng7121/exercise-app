import React, { Component } from 'react';

class Editor extends Component {
    constructor(props) {
      super(props);

      this.setupRefs = []; //stores constant refs for workout setup: exercise, min/sec of breaktime
      for (let i = 0; i < 3; i++) {
        this.setupRefs.push(React.createRef());
      }

      let initialSetRefs = [React.createRef()]; //workout will always have at least 1 set ref
      for (let i = 1; i < this.props.baseWorkout.length; i++) {
        initialSetRefs.push(React.createRef());
      }
      this.state = { 
        setRefs: initialSetRefs
      };
    }

    addEmptySet = (index) => {
      //registers a new empty set at index
      this.props.addEmptySetToBase(index);
      const refs = this.state.setRefs; 
      const repsRef = React.createRef();
      refs.splice(index, 0, repsRef);
      this.setState({ setRefs: refs }, () => {
        this.navigateToNextField(repsRef);
      });
    }

    addEmptySet_wrapper = (index) => {
      return () => {
        this.addEmptySet(index);
      }
    }

    navigateToNextField = (ref) => {
        ref.current.select();
        const viewportOffset = ref.current.getBoundingClientRect(); //coords are w.r.t. current viewport
        if (viewportOffset.top < 0 || viewportOffset.bottom > window.innerHeight) {
          window.scrollTo(0, ref.current.offsetTop);
        }
      }

    handleNextField = (event, index, fieldType) => {
      if (event.key !== 'Enter') return;

      switch (fieldType) {
          case Editor.FIELD_ID_SETUP:
            if (index+1 === this.setupRefs.length) {
                this.navigateToNextField(this.state.setRefs[0]);
            }
            else {
                this.navigateToNextField(this.setupRefs[index+1]);
            }
            break;
          case Editor.FIELD_ID_SET:
            if (index+1 === this.state.setRefs.length) {
                this.addEmptySet(index+1);
            }
            else {
                this.navigateToNextField(this.state.setRefs[index+1]);
            }
            break;
          default:
            return;
      }
    }

    handleNextField_wrapper = (index, fieldType) => {
        return (event) => this.handleNextField(event, index, fieldType);
    }

    handleDeleteSet_wrapper = (index) => {
      return () => {
        if (this.props.baseWorkout.length === 1) return; //workout must always have at least 1 set
        const refs = this.state.setRefs;
        refs.splice(index, 1);
        this.setState({ setRefs: refs }, () => {
          this.props.deleteSet(index);
        });
      }
    }

    updateSet_wrapper = (index) => {
      return (event) => {
        this.props.updateSet(event, index);
      };
    }

    discardWorkout = () => {
      this.props.discardWorkout();
      this.setupRefs[Editor.EXER_IND].current.value = '';
      this.setupRefs[Editor.BREAK_MIN_IND].current.value = 0;
      this.setupRefs[Editor.BREAK_SEC_IND].current.value = '';
      this.setState({
        setRefs: [React.createRef()]
      });
    }

    render () {
      return (
        <div>
            <h4> Edit your workout! </h4>
            <button onClick={this.discardWorkout}> Discard Workout </button>
            <div>
                Exercise: <input type='text' placeholder='Exercise' defaultValue={this.props.exercise} ref={this.setupRefs[Editor.EXER_IND]} 
                                onChange={this.props.updateExercise} 
                                onKeyPress={this.handleNextField_wrapper(Editor.EXER_IND, Editor.FIELD_ID_SETUP)} />
                <br />
                Break time: 
                <input type='number' placeholder='minutes' defaultValue={this.props.breakTime.min} ref={this.setupRefs[Editor.BREAK_MIN_IND]} 
                    onChange={this.props.updateBreakMin} 
                    onKeyPress={this.handleNextField_wrapper(Editor.BREAK_MIN_IND, Editor.FIELD_ID_SETUP)} /> minutes
                <input type='number' placeholder='seconds' defaultValue={this.props.breakTime.sec} ref={this.setupRefs[Editor.BREAK_SEC_IND]} 
                    onChange={this.props.updateBreakSec} 
                    onKeyPress={this.handleNextField_wrapper(Editor.BREAK_SEC_IND, Editor.FIELD_ID_SETUP)} /> seconds
            </div>
            <br />
            <table>
                <tbody>
                {this.props.baseWorkout.map((set, i) => 
                    <tr key={set.key}>
                    <td> {`${i+1})`} </td>
                    <td>
                        <input className='reps' type='number' placeholder='#' defaultValue={set.reps.toString()}
                            ref={this.state.setRefs[i]}
                            onChange={this.updateSet_wrapper(i)} 
                            onKeyPress={this.handleNextField_wrapper(i, Editor.FIELD_ID_SET)} />
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

Editor.FIELD_ID_SETUP = 'field id setup';
Editor.FIELD_ID_SET = 'field id set';
Editor.EXER_IND = 0;
Editor.BREAK_MIN_IND = 1;
Editor.BREAK_SEC_IND = 2;

export default Editor;