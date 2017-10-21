var randomstring = require("randomstring");
var e = module.exports;

e.generateToken = function(length) {
  return randomstring.generate(length || 50);
}

e.isString = function(callBack,i) {
  callBack((typeof i === 'string'));
}

e.isValidDockerLink = function(callBack,i) {
  var regexp = /^([a-zA-Z0-9.-]*)(\/?([a-z0-9.-]{1,63})){1,2}:?([a-zA-Z0-9.-]+)$/
  var pass = regexp.test(i);
  callBack(pass);
}

e.isValidPort = function(callBack,i) {
  callBack((typeof i === 'number' && i >= 1 && i <= 65535));
}

e.isValidEnvVarType = function(callBack,i) {
  if(typeof i === 'string') {
    callBack(( i === 'basic' || i === 'discover' || i === 'port' || i === 'healthcheck'));
    return;
  } callBack(false);
}

e.isValidProvider = function(callBack,i) {
  if(typeof i === 'string') {
    callBack(( i === 'ec2' || i === '56m'));
    return;
  } callBack(false);
}

e.isValidHealthcheckProtocol = function(callBack,i) {
  if(typeof i === 'string') {
    callBack(( i === 'http' || i === 'tcp' || i === 'https'));
    return;
  } callBack(false);
}

e.isValidName = function(callBack,i) {

  if(typeof i !== 'string' || i === '---') {
    callBack(false);
    return;
  }

  callBack( /^[A-Za-z0-9_-]+$/.test(i) );
}

e.isValidEnvVar = function(callBack,i) {
  if(typeof i !== 'string' || i === '___') {
    callBack(false);
    return;
  }

  callBack(/^[A-Za-z_][A-Za-z0-9_]*$/.test(i));
}

e.isBoolean = function(callBack,i) {
  callBack((typeof i === 'boolean'));
}

e.isBooleanAndExternal = function(callback, i, r, o) {
    var bool = typeof i === 'boolean',
        allowed = false;

    if (bool && o) {
        allowed = true;

        // Cannot set true, unless external is public
        if (i && o.external === false) allowed = false;
    }

    callback(allowed);
}

e.isValidContainerArray = function(callBack,i) {
  if(typeof i !== 'object') callBack(false);
  else if(! Array.isArray(i)) callBack(false);
  else if(i.length !== 1) callBack(false);
  else callBack(true);
}

e.isValidInteger = function(callBack,i) {
  if(typeof i !== 'number') callBack(false);
  else if(i < 0) callBack(false);
  else callBack((i === (i|0)));
}
