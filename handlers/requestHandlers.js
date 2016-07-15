"use strict"

let documentToObject = require('../restit');

module.exports = function(lm) {

  let m = lm;
  let e = {};

  e.getContainers = function(req, res) {
    let promises = [];

    return m.Container.find({}).sort({name: 1}).exec(function (err, results) {
        if(err) {res.status(500);res.send(JSON.stringify({error: 'Something went wrong'})); return};
        let data = results.map((result) => result.name)
                          .filter((result, i , results) => results.indexOf(result) === i);
        res.json(data);
    });
  }

  e.getContainerVersions = function(req, res) {
      return m.Container.find({name: req.params.name}).exec(function (err, container) {
        if(err || ! container) {
          res.status(404);
          res.send(JSON.stringify({error: 'Container not found'}));
          return;
        }

        let data = container.map((data) => ({version: data.version, name: data.name, image: data.image}));
        res.json(data);
      });
  }

  e.getContainer = function(req, res) {
      return m.Container.findOne({name: req.params.name, version: req.params.version}).exec(function (err, container) {
        if(err || ! container) {
          res.status(404);
          res.send(JSON.stringify({error: 'Container not found'}));
          return;
        }

        res.json({name: container.name, version: container.version, image: container.image});
      });
  }

  return e;
};
