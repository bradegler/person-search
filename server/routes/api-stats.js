'use strict';

var Config = require('../lib/config').get();
var redis = require('redis');
var client = redis.createClient(Config.redis.port);

var stats = {
    get: function(req, res) {
        client.hlen(Config.index.prefix, function(err, size) {
            res.send(200, {
                size: size
            });
        });
    }
};

module.exports.load = function(app) {
    app.get('/api/stats', stats.get);
};