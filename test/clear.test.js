'use strict';

var Config = require('../server/lib/config').get();
var expect = require('chai').expect;
var redis = require('redis');
var client = redis.createClient(Config.redis.port);
var clear = require('../server/lib/clear');

describe("clear", function() {
    it("should not remove items when the pattern does not match any keys", function(done) {
        client.get('test:fake:key', function(result) {
            expect(result).to.be.null;
            clear.clear('test:fake:key', function(removed) {
                expect(removed).to.equal(0);
                done();
            });
        });
    });
    it("should remove items when the pattern matches a single key", function(done) {
        client.get('test:fake:key:1', function(result) {
            expect(result).to.be.null;
            client.set('test:fake:key:1', 'test');
            clear.clear('test:fake:key:1', function(removed) {
                expect(removed).to.equal(1);
                done();
            });
        });
    });
    it("should remove items when the pattern matches multiple keys", function(done) {
        client.set('test:fake:key:m:1', 'test');
        client.set('test:fake:key:m:2', 'test');
        clear.clear('test:fake:key:m:*', function(removed) {
            expect(removed).to.equal(2);
            done();
        });
    });

});