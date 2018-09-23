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

export function isBreakTimeZero(breakTime) {
  return breakTime.min === 0 && breakTime.sec === 0;
}

//from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
export function storageAvailable(type) {
  try {
      var storage = window[type],
          x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
  }
  catch(e) {
      return e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
          // acknowledge QuotaExceededError only if there's something already stored
          storage.length !== 0;
  }
}

export function Time(min, sec) {
  this.min = min;
  this.sec = sec;
}

// from https://stackoverflow.com/a/32108184
export function isEmptyObj(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}