'use strict';
var Config = require('./config').get();
var redis = require('redis');
var async = require('async');

var client = redis.createClient(Config.redis.port);
client.on("error", function(err) {
    console.log("Error " + err);
});

function searchSingle(term, fn) {
    client.zrange(term, 0, Config.index.max,
        function(err, results) {
            if (err) {
                fn(err);
            }
            readValues(results, fn);
        });
}

function readValues(idxes, fn) {
    if (idxes.length === 0) fn(null, []);
    var results = [];
    //console.log("Range found " + idxes.join(','));
    client.hmget(Config.index.prefix, idxes, function(err, data) {
        if (err) fn(err);
        //console.log('HMGET:' + data.join(','));
        data.forEach(function(row) {
            results.push(JSON.parse(row));
        });
        fn(null, results);
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
                client.expire(Config.index.cache + ':' + combined, Config.index.cache_ttl);
                searchSingle(Config.index.cache + ':' + combined, fn);
            });
        } else {
            searchSingle(Config.index.cache + ':' + combined, fn);
        }
    });
}

function search(terms, fn) {
    //console.log(terms);
    if (terms === null) {
        console.log('Null search term list');
        fn(null, null);
    }
    var words = [];
    terms.forEach(function(term) {
        words.push(sensitize(term));
    });

    if (words.length === 0) {
        console.log('Empty search term list');
        fn(null, []);
    } else if (words.length === 1) {
        //console.log('Single term search');
        searchSingle(Config.index.prefix + ":" + words[0], fn);
    } else {
        //console.log('Multiple term search');
        searchMultiple(words, fn);
    }
}

function updateTerm(oldword, newword, id, rank, fn) {
    var oword = sensitize(oldword);
    var nword = sensitize(newword);

    var prefix, idx, i;
    var multi = client.multi();
    for (i = 1; i <= oword.length; i++) {
        prefix = oword.substr(0, i);
        idx = Config.index.prefix + ':' + prefix;
        //console.log('Removing ' + id + ' from ' + idx);
        multi.zrem(idx, id);
    }
    for (i = 1; i <= nword.length; i++) {
        prefix = nword.substr(0, i);
        idx = Config.index.prefix + ':' + prefix;
        //console.log(idx);
        multi.zadd(idx, rank + (nword.length - i), id);
    }
    multi.exec(fn);
}

function addTerm(word, id, rank, fn) {
    var w = sensitize(word);
    var multi = client.multi();
    for (var i = 1; i <= w.length; i++) {
        var prefix = w.substr(0, i);
        var idx = Config.index.prefix + ':' + prefix;
        //console.log(idx);
        multi.zadd(idx, rank + (word.length - i), id);
    }
    multi.exec(fn);
}

function sensitize(word) {
    if (!Config.index.case_sensitive) {
        return word.trim().toLowerCase();
    } else {
        return word.trim();
    }
}

function addTerms(words, id, ranks, fn) {
    var actions = [];
    words.forEach(function(word, idx) {
        actions.push(function(callback) {
            addTerm(word, id, ranks[idx], function(err) {
                if (err) throw err;
                callback();
            });
        });
    });
    async.parallel(actions, function(err) {
        fn(err);
    });
}

function updateTerms(oldwords, newwords, id, ranks, fn) {
    var actions = [];
    oldwords.forEach(function(word, idx) {
        actions.push(function(callback) {
            updateTerm(word, newwords[idx], id, ranks[idx], function(err) {
                if (err) throw err;
                callback();
            });
        });
    });
    async.parallel(actions, function(err) {
        fn(err);
    });
}

function store(id, content, fn) {
    client.hset(Config.index.prefix, id, content, fn);
}

function retrieve(id, fn) {
    client.hget(Config.index.prefix, id, fn);

}

exports.search = search;
exports.store = store;
exports.retrieve = retrieve;
exports.addTerm = addTerm;
exports.addTerms = addTerms;
exports.updateTerm = updateTerm;
exports.updateTerms = updateTerms;