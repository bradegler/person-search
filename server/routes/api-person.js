'use strict';

var Person = require('../lib/person').Person;

var person = {
    get: function(req, res) {
        res.send(200, {});
    },
    post: function(req, res) {
        console.log(req.body);
        new Person(req.body).save();
        res.send(req.body);
    }
};

module.exports.load = function(app) {
    app.get('/api/person', person.get);
    app.post('/api/person', person.post);
};