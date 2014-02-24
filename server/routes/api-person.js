'use strict';

var person = {
    get: function(req, res) {
        res.send(200, {});
    },
    post: function(req, res) {
        console.log(req.body);
        res.send(req.body);
    }
};

module.exports.load = function(app) {
    app.get('/api/person', person.get);
};