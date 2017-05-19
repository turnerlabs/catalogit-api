"use strict";

let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let morgan = require('morgan');
let request = require('request');

let handlers = require('./handlers');
let models = require('./models');
let restit = require('./restit');

let app = express();
let endpoints = {get:[],post:[],put:[],delete:[]};
let modelEndpoints = restit.genEndpoints(models, handlers.mongoose, handlers.config);
let requestHelper = handlers.requestHelper(handlers.mongoose);
let allEndpoints = modelEndpoints.concat([
  {
    path:        '/v1/containers',
    type:        'get',
    function:    requestHelper.getContainers,
    description: 'Returns all container names',
    fields: []
  }, {
    path:        '/v1/container/:name',
    type:        'get',
    function:    requestHelper.getContainerVersions,
    description: 'Returns a container object with all of its version',
    fields: []
  }, {
    path:        '/v1/container/:name/:version',
    type:        'get',
    function:    requestHelper.getContainer,
    description: 'Returns a single container object.',
    fields: []
  }
]);

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('tiny', { skip: (req, res) => req.path === handlers.config.hc } ));
app.use(handlers.errorHandler);

app.all('/v1*', (req, res, next) => {
    res.header('Content-Type', 'application/json');
    next();
});

app.post('/v1/containers', (req, res, next) => {
    if (!req.body.image) {
        res.status(500).json({"message": "You must provide an image"});
        return;
    }
    req.body.image = req.body.image.replace('https://', '').replace('http://', '');
    next();
});

if (process.env.DEPLOYIT) {
    app.post('/v1/containers', (req, res, next) => {
        let body = req.body;
        let imagePieces = body.image.split(':');
        let deployitPayload = {
            name: body.name,
            version: body.version,
        };

        deployitPayload.image = imagePieces[0];

        let options = {headers: {"content-type": "application/json"}, body: JSON.stringify(deployitPayload)};
        request.post(process.env.DEPLOYIT + '/containers/' + body.name + '/' + body.version, options, (error, response, body) => {
            console.log(body);
        });
        next();
    });
}

allEndpoints.forEach((endpoint) => {
  console.log(endpoint.type, endpoint.path);
  app[endpoint.type](endpoint.path, endpoint.function);
  endpoints[endpoint.type].push({path: endpoint.path, fields: endpoint.fields, description: endpoint.description});
});


app.get(handlers.config.versionPath + '/endpoints', (req, res) => restit.genDocEndpoints(endpoints, req, res));
app.get(handlers.config.hc, (req, res) => res.json({version: handlers.config.version}));
app.listen(handlers.config.port, () => {
  console.log('\n-------------------------------------------------\n');
  console.log('Catalogit-API is running on ' + handlers.config.port);
  console.log('\n-------------------------------------------------\n');
});
module.exports = app;
