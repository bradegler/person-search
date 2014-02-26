'use strict';

var Config = require('./config').get();
var redis = require('redis');
var async = require('async');

var client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});

function Person(obj) {
    this.id = obj.id;
    this.name = {};
    this.name.last = obj.name.last;
    this.name.first = obj.name.first;
    this.phone = obj.phone;
}

Person.prototype.save = function(fn) {
    //console.log("saving " + JSON.stringify(this));
    var self = this;
    client.hget(Config.index.prefix, this.id, function(err, old) {
        if (err) throw err;
        if (old === undefined || old === null) {
            self.insert(fn);
        } else {
            self.update(old, fn);
        }
    });

};

Person.prototype.insert = function(fn) {
    //console.log("inserting");
    var self = this;
    client.hset(Config.index.prefix, this.id, JSON.stringify(this), function(e1) {
        if (e1) fn(e1);
        addToIndex(self.name.last, self.id, function(e2) {
            if (e2) fn(e2);
            addToIndex(self.name.first, self.id, fn);
        });
    });
};

Person.prototype.update = function(old, fn) {
    //console.log("updating");
    var toUpdate = [];
    var self = this;
    if (this.name.last !== old.name.last) {
        toUpdate.push(function(callback) {
            replaceInIndex(old.name.last, self.name.last, self.id, function(err) {
                if (err) throw err;
                callback();
            });
        });
    }
    if (this.name.first !== old.name.first) {
        toUpdate.push(function(callback) {
            replaceInIndex(old.name.first, self.name.first, self.id, function(err) {
                if (err) throw err;
                callback();
            });
        });
    }
    toUpdate.push(function(callback) {
        client.hset(Config.index.prefix, self.id, JSON.stringify(self), function(err) {
            if (err) throw err;
            callback();
        });
    });
    async.parallel(toUpdate, function(err) {
        fn(err);
    });
};

function replaceInIndex(oldword, newword, id, fn) {
    var oword = oldword.toLowerCase();
    var nword = newword.toLowerCase();

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
        multi.zadd(idx, 0, id);
    }
    multi.exec(function(err) {
        fn(err);
    });
}

function addToIndex(word, id, fn) {
    var w = word.toLowerCase();
    var multi = client.multi();
    for (var i = 1; i <= w.length; i++) {
        var prefix = w.substr(0, i);
        var idx = Config.index.prefix + ':' + prefix;
        //console.log(idx);
        multi.zadd(idx, 0, id);
    }
    multi.exec(function(err) {
        fn(err);
    });
}

exports.Person = Person;