export function parsedBreakTimeStr(breakTime) {
    const { min, sec } = breakTime;
    let msg = '';
    
    if (min || min === 0) {
      if (min !== 0 || !sec) {
        const label = min === 1? 'minute' : 'minutes';
        msg += min.toString() + ' '+ label + ' ';
      }
      //else, min == 0. omit it
    }
    else {
      msg += '(invalid minutes) ';
    }
    
    if (sec || sec === 0) {
      if (sec !== 0 || !min) {
        const label = sec === 1? 'second' : 'seconds';
        msg += sec.toString() + ' ' + label;
      }
      //else, sec == 0. omit it
    }
    else {
      msg += '(invalid seconds)';
    }
  
    return msg;
  }