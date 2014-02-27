'use strict';

var Person = require('../lib/person').Person;

var person = {
    post: function(req, res) {
        console.log(req.body);
        new Person(req.body).save();
        res.send(req.body);
    }
};

module.exports.load = function(app) {
    app.post('/api/person', person.post);
};