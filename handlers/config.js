"use strict";

let packageJSON = require('../package.json');

module.exports = {
    version: packageJSON.version,
    versionPath: '/v1',
    port: process.env.PORT || 8080,
    hc: process.env.HEALTHCHECK || '/hc',
    mongo_uri: process.env.MONGO_URI || 'mongodb://localhost:27017/catalogit'
};
