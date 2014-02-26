'use strict';
var Config = require('./config').get();
var redis = require('redis');

var client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});

function searchSingle(term, fn) {
    client.zrange(term, 0, Config.search.max,
        function(err, results) {
            if (err) {
                fn(err);
            }
            readValues(results, fn);
        });
}

function readValues(idxes, fn) {
    if (idxes.length === 0) fn(null, []);
    var people = [];
    //console.log("Range found " + idxes.join(','));
    client.hmget(Config.index.prefix, idxes, function(err, data) {
        if (err) fn(err);
        //console.log('HMGET:' + data.join(','));
        data.forEach(function(row) {
            people.push(JSON.parse(row));
        });
        fn(null, people);
    });
}

function searchMultiple(terms, fn) {
    var combined = terms.join('|');
    client.exists(Config.index.cache + ':' + combined, function(err, cached) {
        if (!cached) {
            client.zinterstore(Config.index.cache + ':' + combined, terms, function(err) {
                if (err) fn(err);
                client.expire(Config.index.cache + ':' + combined, 300);
                searchSingle(Config.index.cache + ':' + combined, fn);
            });
        } else {
            searchSingle(Config.index.cache + ':' + combined, fn);
        }
    });
}

function search(terms, fn) {
    if (terms === null || terms.length === 0) fn(null, []);

    if (terms.length === 1) {
        searchSingle(Config.index.prefix + ":" + terms[0], fn);
    } else {
        searchMultiple(terms, fn);
    }
};

exports.search = search;