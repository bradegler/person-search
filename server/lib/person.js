'use strict';

var Config = require('./config').get();
var redis = require('redis');

var client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});

function Person(obj) {
    this._id = obj.id;
    this.name = {};
    this.name.last = obj.name.last;
    this.name.first = obj.name.first;
    this.phone = obj.phone;
}

Person.prototype.save = function() {
    console.log("saving " + JSON.stringify(this));
    var self = this;
    client.hget(Config.index.prefix, this._id, function(err, old) {
        if (err) throw err;
        if (old === undefined || old === null) {
            self.insert();
        } else {
            self.update(old);
        }
    });

};

Person.prototype.insert = function() {
    console.log("inserting");
    client.hset(Config.index.prefix, this._id, JSON.stringify(this));
};

Person.prototype.update = function(old) {
    console.log("updating");
};

exports.Person = Person;