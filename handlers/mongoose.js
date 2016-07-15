"use strict";

let mongoose = require('mongoose');
let containerModel = require('../models/container');
let config = require('./config');
let restit = require('../restit');

let e = module.exports;
e.DB = mongoose.connection;
e.models = {};

let Schema = mongoose.Schema;
let containerSchemas = restit.genSchemas(containerModel);
let mongoConfig = {
  url: config.mongo_uri,
  options: {
    db: {
      w: 1,
      socketOptions: {
        keepAlive: 1,
        connectTimeoutMS: 30000
      }
    },
    server: {
      socketOptions: {
        keepAlive: 1,
        connectTimeoutMS: 30000
      },
      auto_reconnect: true
    }
  }
};

mongoose.connect(mongoConfig.url, mongoConfig.options);


Object.keys(containerSchemas).forEach(function(schema) {
  var tempSchema = new Schema(containerSchemas[schema].model);
  var word = schema;
  word = word[0].toUpperCase() + word.slice(1);
  e.models[word] = mongoose.model(word,tempSchema);
  e[word] = e.models[word];
  containerSchemas[schema].indexes.forEach(function(ind) {
    tempSchema.index(ind.fields,{unique: ind.unique});
  });
});
