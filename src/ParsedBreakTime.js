import React from 'react';

function ParsedBreakTime(props) {
    const { min, sec } = props.breakTime;
    let msg = '';
  
    if (min || min === 0) {
      if (min !== 0) {
        const label = min === 1? 'minute' : 'minutes';
        msg += min.toString() + ' '+ label + ' ';
      }
      //else, min == 0. omit it
    }
    else {
      msg += '(invalid minutes) ';
    }
    
    if (sec || sec === 0) {
      const label = sec === 1? 'second' : 'seconds';
      msg += sec.toString() + ' ' + label;
    }
    else {
      msg += '(invalid seconds)';
    }
  
    return (
      <span> {msg} </span>
    );
  }

  export default ParsedBreakTime;