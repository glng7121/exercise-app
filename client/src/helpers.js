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

export function audioBufObj(buffer, name = null, reportError = true) {
  return { 
    buffer: buffer,
    timeoutID: null,
    name: name,
    reportError: reportError
  };
}

export function addSuffixToNum(num) {
  const safeNum = Number(num);
  const ones = Math.floor(safeNum % 10);
  let prefix = '';
  if (safeNum >= 11 && safeNum <= 19) {
      prefix = 'th';
  }
  else {
      switch (ones) {
          case 1:
              prefix = 'st';
              break;
          case 2:
              prefix = 'nd';
              break;
          case 3:
              prefix = 'rd';
              break;
          default:
              prefix = 'th';
              break;
      }
  }

  return safeNum+prefix;
}