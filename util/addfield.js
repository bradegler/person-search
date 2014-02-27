#!/usr/bin/env node

'use strict';

var Config = require('../server/lib/config').get();
var search = require('../server/lib/search');
var Person = require('../server/lib/person').Person;
var program = require('commander');
var async = require('async');
var redis = require('redis');
var async = require('async');

var client = redis.createClient(Config.redis.port);

program
    .version('0.0.1')
    .option('-f, --file <name>', 'file to load')
    .option('-t, --type [type]', 'file type [json, pipe]', 'json')
    .option('-l, --limit <limit>', 'max items to process', '100000')
    .parse(process.argv);

client.hlen(Config.index.prefix, function(err, size) {
    console.log('index size: ' + size);
    client.hkeys(Config.index.prefix, function(err, keys) {
        console.log('read keys');
        for (var idx = 0; idx < keys.length; idx++) {
            var key = keys[idx];
            var count = 0;
            client.hget(Config.index.prefix, key, function(err, data) {
                var p = new Person(JSON.parse(data));
                search.addTerms(p.dob.split('-'), p.id, [Config.person.dob.rank, Config.person.dob.rank, Config.person.dob.rank], function(err) {
                    console.log(count);
                    if (count++ === size - 1) {
                        process.exit(0);
                    }
                });
            });
        }
    });
});