'use strict';

var Config = require('./config').get();
var search = require('./search');


function Person(obj) {
    this.id = obj.id;
    this.name = {};
    if (obj.name) {
        this.name.last = obj.name.last;
        this.name.first = obj.name.first;
        this.name.mid = obj.name.mid;
    }
    this.phone = obj.phone;
    this.address = {};
    if (obj.address) {
        this.address.line = obj.address.line;
        this.address.city = obj.address.city;
        this.address.state = obj.address.state;
        this.address.zip = obj.address.zip;
    }
    this.dob = obj.dob;
}

Person.prototype.save = function(fn) {
    //console.log("saving " + JSON.stringify(this));
    var self = this;
    search.retrieve(this.id, function(err, old) {
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
    var terms = [];
    var ranks = [];
    var parts = [];
    if (Config.person.lastname.index) {
        terms.push(self.name.last);
        ranks.push(Config.person.lastname.rank);
    }
    if (Config.person.firstname.index) {
        terms.push(self.name.first);
        ranks.push(Config.person.firstname.rank);
    }
    if (Config.person.phone.index && self.phone) {
        terms.push(self.phone);
        ranks.push(Config.person.phone.rank);
    }
    if (Config.person.dob.index && self.dob) {
        if (self.dob.indexOf('-') !== -1) {
            parts = self.dob.split('-');
        } else if (self.dob.indexOf('/') !== -1) {
            parts = self.dob.split('/');
        }
        parts.forEach(function(part) {
            if (part.indexOf('0') === 0) {
                terms.push(part.substr(1));
                ranks.push(Config.person.dob.rank);
            }
            terms.push(part);
            ranks.push(Config.person.dob.rank);
        });
    }
    if (Config.person.address.index && self.address) {
        if (self.address.line) {
            parts = self.address.line.split(' ');
            parts.forEach(function(part) {
                terms.push(part);
                ranks.push(Config.person.address.rank);
            });
        }
        if (self.address.city) {
            terms.push(self.address.city);
            ranks.push(Config.person.address.rank + 15);
        }
        if (self.address.state) {
            terms.push(self.address.state);
            ranks.push(Config.person.address.rank + 30);
        }
        if (self.address.zip) {
            terms.push(self.address.zip);
            ranks.push(Config.person.address.rank + 10);
        }
    }

    search.store(this.id, JSON.stringify(this), function(e1) {
        if (e1) fn(e1);
        search.addTerms(terms, self.id, ranks, fn);
    });
};

Person.prototype.update = function(old, fn) {
    //console.log("updating");
    var self = this;
    var oldterms = [];
    var terms = [];
    var ranks = [];
    var hasUpdates = false;
    if (Config.person.lastname.index && self.name.last !== old.name.last) {
        oldterms.push(old.name.last);
        terms.push(self.name.last);
        ranks.push(Config.person.lastname.rank);
        hasUpdates = true;
    }
    if (Config.person.firstname.index && self.name.first !== old.name.first) {
        oldterms.push(old.name.first);
        terms.push(self.name.first);
        ranks.push(Config.person.firstname.rank);
        hasUpdates = true;
    }
    if (Config.person.phone.index && self.phone !== old.phone) {
        oldterms.push(old.phone);
        terms.push(self.phone);
        ranks.push(Config.person.phone.rank);
        hasUpdates = true;
    }
    // TODO
    // DOB and Address update
    search.store(self.id, JSON.stringify(self), function(err) {
        if (err) fn(err);
        if (hasUpdates) {
            search.updateTerms(oldterms, terms, self.id, ranks, fn);
        } else {
            fn(null);
        }
    });
};

exports.Person = Person;