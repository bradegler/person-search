'use strict';

var expect = require('chai').expect;
var Person = require('../server/lib/person').Person;
var search = require('../server/lib/search');
var clear = require('../server/lib/clear');
var Config = require('../server/lib/config').get();

Config.index.prefix = 'test:idx';
Config.index.cache = 'test:cache';

var redis = require('redis');
var client = redis.createClient(Config.redis.port);
//redis.debug_mode = true;

describe('Search', function() {
    before(function(done) {
        clear.clear('test:*', function() {
            done();
        });
    });

    describe('#addTerm', function() {
        it("should add a search term to the index", function(done) {
            search.addTerm('ironman', "24", 0, function(err) {
                if (err) throw err;
                client.exists(Config.index.prefix + ':ironman', function(err, exists) {
                    expect(exists).to.eql(1);
                    done();
                });
            });
        });
    });

    describe('#updateTerm', function() {
        before(function(done) {
            search.addTerm('america', "22", 0, function(err) {
                done();
            });
        });
        it("should update a search term in the index", function(done) {
            search.updateTerm('america', 'captain', "22", 0, function(err) {
                if (err) throw err;
                client.exists(Config.index.prefix + ':captain', function(err, exists) {
                    expect(exists).to.eql(1);
                    done();
                });
            });
        });
    });

    describe('#search', function() {
        before(function(done) {
            new Person({
                id: "1",
                name: {
                    last: "search",
                    first: "test"
                },
                phone: "1234567890"
            }).insert(function(err) {
                new Person({
                    id: "2",
                    name: {
                        last: "search",
                        first: "other"
                    },
                    phone: "1234567890"
                }).insert(function(err) {
                    new Person({
                        id: "3",
                        name: {
                            last: "oden",
                            first: "thor"
                        },
                        phone: "1234567890"
                    }).insert(function(err) {
                        done();
                    });
                });
            });
        });

        it("should return no results if no terms are specified", function(done) {
            search.search([], function(err, results) {
                expect(results).to.be.not.null;
                expect(results).to.have.length(0);
                done(err);
            });
        });

        it("should find results via a single search term", function(done) {
            search.search(['oden'], function(err, results) {
                expect(results).to.be.not.undefined;
                expect(results).to.be.not.null;
                expect(results).to.have.length(1);
                done();
            });
        });
        it("should find multiple results from a partial search term", function(done) {
            search.search(['sea'], function(err, results) {
                expect(results).to.be.not.undefined;
                expect(results).to.be.not.null;
                expect(results).to.have.length(2);
                expect(results[0].id).to.eql("1");
                expect(results[1].id).to.eql("2");
                done();
            });
        });
        it("should find results from multiple search terms", function(done) {
            search.search(['sea', 'tes'], function(err, results) {
                expect(results).to.be.not.undefined;
                expect(results).to.be.not.null;
                expect(results).to.have.length(1);
                expect(results[0].id).to.eql("1");
                done();
            });
        });
        it("should cache results from multiple search terms", function(done) {
            search.search(['sea', 'tes'], function(err, results) {
                expect(results).to.be.not.undefined;
                expect(results).to.be.not.null;
                expect(results).to.have.length(1);
                expect(results[0].id).to.eql("1");
                client.exists(Config.index.cache + ':sea|tes', function(err, cached) {
                    expect(cached).to.eql(1);
                    client.ttl(Config.index.cache + ':sea|tes', function(err, ttl) {
                        expect(ttl).to.eql(Config.index.cache_ttl);
                        done();
                    });
                });
            });
        });
    });
});