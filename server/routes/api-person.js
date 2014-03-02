'use strict';

var Person = require('../lib/person').Person;

var person = {
    post: function(req, res) {
        console.log(req.body);
        var p = {
            name: {},
            address: {}
        };
        p.name.first = req.body.firstName;
        p.name.last = req.body.lastName;
        p.phone = req.body.phone;
        p.dob = req.body.dob;

        new Person(p).save();
        res.redirect('/');
    }
};

module.exports.load = function(app) {
    app.post('/api/person', person.post);
};