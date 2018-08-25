import React from 'react';
import { parsedBreakTimeStr } from './helpers.js';

function ParsedBreakTime(props) {
    let msg = parsedBreakTimeStr(props.breakTime);
    return (
      <span> {msg} </span>
    );
  }

  export default ParsedBreakTime;