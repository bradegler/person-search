#!/usr/bin/env node

'use strict';

var async = require('async');
var fs = require('fs');
var program = require('commander');
var redis = require('redis');
var client = redis.createClient();

program
    .version('0.0.1')
    .option('-f, --file <name>', 'file to load')
    .parse(process.argv);

fs.readFile(program.file, {
    encoding: 'utf-8'
}, function(err, data) {
    var lines = data.split('\n');
    var actions = [];
    lines.forEach(function(line, idx) {
        var parts = line.split('|');
        actions.push(function(callback) {
            client.zadd('si:states', idx, parts[0], function(err) {
                if (err) console.log(err);
                callback();
            });
        });
    });
    async.parallel(actions, function() {
        process.exit(0);
    });
});