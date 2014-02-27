'use strict';

var search = require('../lib/search');

var s = {
    get: function(req, res) {
        search.search(req.query.term.split(' '), function(err, results) {
            res.send(200, {
                results: results
            });
        });
    }
};

module.exports.load = function(app) {
    app.get('/api/search', s.get);
};