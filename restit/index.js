"use strict";

let genSchemas = require('./genMongooseModels');
let genEndpoints = require('./genEndpointsFromSchema');
let genDocEndpoints = require('./genDocEndpoints');
let documentToObject = require('./lib/documentToObject');
let helpers = require('./lib/restHelpers');

module.exports = {
    genSchemas: genSchemas,
    genEndpoints: genEndpoints,
    genDocEndpoints: genDocEndpoints,
    documentToObject: documentToObject,
    helpers: helpers
};
