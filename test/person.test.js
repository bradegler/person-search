'use strict';

var expect = require('chai').expect;
var Person = require('../server/lib/person').Person;
var clear = require('../server/lib/clear');
var Config = require('../server/lib/config').get();
Config.index.prefix = 'test:idx';

var redis = require('redis');
var client = redis.createClient();

describe('Person', function() {
    describe('#constructor', function() {
        it('should populate internal attributes', function() {
            var p = new Person({
                id: "1",
                name: {
                    last: "test",
                    first: "first"
                },
                phone: "1234567890"
            });
            expect(p).to.have.property('id', '1');
            expect(p).to.have.property('name');
            expect(p).to.have.property('phone', '1234567890');
            expect(p.name).to.have.property('last', 'test');
            expect(p.name).to.have.property('first', 'first');
        });
    });

    describe('#insert', function() {
        beforeEach(function(done) {
            clear.clear(Config.index.prefix + '*', function() {
                done();
            });
        });
        it('should insert a person to the index', function(done) {
            var p = new Person({
                id: "1",
                name: {
                    last: "last",
                    first: "first"
                },
                phone: "1112223333"
            });
            p.insert(function(err) {
                expect(err).to.be.null;
                client.hget(Config.index.prefix, p.id, function(e2, data) {
                    expect(e2).to.be.null;
                    expect(data).to.be.not.null;
                    var parsed = JSON.parse(data);
                    expect(parsed).to.have.property('id', '1');
                    expect(parsed).to.have.property('name');
                    expect(parsed).to.have.property('phone', '1112223333');
                    expect(parsed.name).to.have.property('last', 'last');
                    expect(parsed.name).to.have.property('first', 'first');

                    client.keys(Config.index.prefix + ':*', function(e3, results) {
                        expect(e3).to.be.null;
                        expect(results).to.have.length(9);
                        expect(results).to.contain(Config.index.prefix + ':f');
                        expect(results).to.contain(Config.index.prefix + ':fi');
                        expect(results).to.contain(Config.index.prefix + ':fir');
                        expect(results).to.contain(Config.index.prefix + ':firs');
                        expect(results).to.contain(Config.index.prefix + ':first');
                        expect(results).to.contain(Config.index.prefix + ':l');
                        expect(results).to.contain(Config.index.prefix + ':la');
                        expect(results).to.contain(Config.index.prefix + ':las');
                        expect(results).to.contain(Config.index.prefix + ':last');
                        done();
                    });
                });
            });
        });
    });

    describe('#update', function() {
        beforeEach(function(done) {
            clear.clear(Config.index.prefix + '*', function() {
                new Person({
                    id: "1",
                    name: {
                        first: "first",
                        last: "update"
                    },
                    phone: "111222333"
                }).insert(done);
            });
        });
        it('should update a persons last name', function(done) {
            client.hget(Config.index.prefix, "1", function(err, old) {
                var obj = JSON.parse(old);
                var upd = new Person(obj);
                upd.name.last = 'downdate';
                upd.update(obj, function(err) {
                    if (err) throw err;
                    client.zrange(Config.index.prefix + ':update', 0, -1, function(err, r1) {
                        if (err) throw err;
                        expect(r1).to.have.length(0);
                        client.zrange(Config.index.prefix + ':downdate', 0, -1, function(err, r2) {
                            expect(r2).to.have.length(1);
                            done();
                        });
                    });
                });
            });
        });
    });
});