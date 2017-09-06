"use strict";

module.exports = function (lm) {
    let m = lm,
        e = {};

    e.getContainers = function (req, res) {

        return m.Container.distinct('name', {}).exec((err, results) => {
            if (err) {
                res.status(500);
                return res.json({ error: 'Something went wrong' });
            }
            res.json(results);
        });
    }

    e.getContainerVersions = function (req, res) {
        let opts = { name: req.params.name, active: true };
        if (typeof req.query.all !== 'undefined') {
            delete opts.active;
        }

        return m.Container.find(opts).exec((err, container) => {
            if (err || !container) {
                res.status(404);
                return res.json({ error: 'Container not found' });
            }

            let data = container.map((data) => ({ version: data.version, name: data.name, image: data.image }));
            res.json(data);
        });
    }

    e.getContainer = function (req, res) {
        return m.Container.findOne({ name: req.params.name, version: req.params.version }).exec((err, container) => {
            if (err || !container) {
                res.status(404);
                return res.json({ error: 'Container not found' });
            }

            res.json({ name: container.name, version: container.version, image: container.image, active: container.active });
        });
    }

    e.addContainer = function (req, res) {
        return m.Container.findOne({ name: req.params.name, version: req.params.version }).exec((err, container) => {
            if (err || !container) {
                res.status(404);
                return res.json({ error: 'Container not found' });
            }
            container.active = true;
            container.save((err, item) => {
                if (err) {
                    return res.json({ error: 'Container not updated.', message: err.message });
                }

                res.json({ name: item.name, version: item.version, image: item.image, active: item.active });
            });
        });
    }

    e.removeContainer = function (req, res) {
        return m.Container.findOne({ name: req.params.name, version: req.params.version }).exec((err, container) => {
            if (err || !container) {
                res.status(404);
                return res.json({ error: 'Container not found' });
            }
            container.active = false;
            container.save((err, item) => {
                if (err) {
                    return res.json({ error: 'Container not updated.', message: err.message });
                }

                res.json({ name: item.name, version: item.version, image: item.image, active: item.active });
            });
        });
    }

    return e;
};
