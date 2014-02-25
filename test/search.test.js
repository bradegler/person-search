'use strict';

var expect = require('chai').expect;
var Person = require('../server/lib/person').Person;
var search = require('../server/lib/search');
var clear = require('../server/lib/clear');
var Config = require('../server/lib/config').get();
Config.index.prefix = 'test:idx';

var redis = require('redis');
var client = redis.createClient();

describe('Search', function() {
    beforeEach(function(done) {
        clear.clear(Config.index.prefix + '*', function() {
            done();
        });
    });
});