"use strict";

module.exports = function (lm) {
    let m = lm,
        e = {};

    e.getContainers = function (req, res) {
        let promises = [];

        return m.Container.find({}).sort({name: 1}).exec((err, results) => {
            if (err) {
                res.status(500);
                return res.json({ error: 'Something went wrong' });
            }

            let data = results.map((result) => result.name).filter((result, i , results) => results.indexOf(result) === i);

            cached = data;
            res.json(data);
        });
    }

    e.getContainerVersions = function (req, res) {
        return m.Container.find({ name: req.params.name }).exec((err, container) => {
            if (err || ! container) {
                res.status(404);
                return res.json({ error: 'Container not found' });
            }

            let data = container.map((data) => { version: data.version, name: data.name, image: data.image });
            res.json(data);
        });
    }

    e.getContainer = function (req, res) {
        return m.Container.findOne({ name: req.params.name, version: req.params.version }).exec((err, container) => {
            if (err || ! container) {
                res.status(404);
                return res.json({ error: 'Container not found' });
            }

            res.json({ name: container.name, version: container.version, image: container.image });
        });
    }

    return e;
};
