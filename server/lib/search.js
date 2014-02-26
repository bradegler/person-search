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
    console.log(combined);
    client.exists(Config.index.cache + ':' + combined, function(err, cached) {
        if (err) fn(err);
        console.log('Cached: ' + cached);
        if (cached === 0) {
            var singles = [];
            terms.forEach(function(term) {
                singles.push(Config.index.prefix + ':' + term);
            });
            var cmd = [Config.index.cache + ':' + combined, singles.length];
            client.zinterstore(cmd.concat(singles), function(err) {
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
    console.log(terms);
    if (terms === null) {
        console.log('Null search term list');
        fn(null, null);
    }

    if (terms.length === 0) {
        console.log('Empty search term list');
        fn(null, []);
    } else if (terms.length === 1) {
        console.log('Single term search');
        searchSingle(Config.index.prefix + ":" + terms[0], fn);
    } else {
        console.log('Multiple term search');
        searchMultiple(terms, fn);
    }
};

exports.search = search;