'use strict';
var Config = require('./config').get();
var redis = require('redis');

var client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});

function searchSingle(term, fn) {
    client.zrange(Config.index.prefix + ":" + term, 0, Config.search.max, function(err, results) {
        if (err) throw err;
        var people = [];
        if (results.length === 0) {
            fn(people);
        } else {
            client.hmget(results, function(e2, data) {
                if (e2) throw e2;
                data.forEach(function(row) {
                    people.push(JSON.parse(data));
                });
                fn(people);
            });
        }
    });
}

function search(terms, fn) {
    if (terms.length === 0) fn(null);

    if (terms.length === 1) {
        searchSingle(terms[0], fn);
    } else {

    }
};

exports.search = search;