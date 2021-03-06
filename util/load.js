#!/usr/bin/env node

'use strict';

var lazy = require('lazy');
var fs = require('fs');

var program = require('commander');
var async = require('async');
var Person = require('../server/lib/person').Person;

program
    .version('0.0.1')
    .option('-f, --file <name>', 'file to load')
    .option('-t, --type [type]', 'file type [json, pipe]', 'json')
    .option('-l, --limit <limit>', 'max items to process', '100000')
    .parse(process.argv);


if (program.type === 'json') {
    handleJson(program.file);
} else if (program.type === 'pipe') {
    handlePipe(program.file, program.limit);
}

function handlePipe(file, limit) {
    var count = 0;
    new lazy(fs.createReadStream(file)).lines
        .forEach(function(line) {
            var parts = line.toString().split('|');
            var phone;
            if (parts[9] !== undefined && parts[10] !== undefined && parts[9].length > 0 && parts[10].length > 0) {
                phone = '' + parts[9] + '-' + parts[10].substr(0, 3) + '-' + parts[10].substr(3);
            }
            var dob;
            if (parts[4] !== undefined && parts[4].length > 0) {
                var sections = parts[4].split('-');
                dob = sections[2] + '-' + sections[0] + '-' + sections[1];
            }
            var person = {
                id: parts[0],
                name: {
                    last: parts[1],
                    first: parts[2],
                    mid: parts[3],
                },
                dob: dob,
                address: {
                    line: parts[5],
                    city: parts[6],
                    state: parts[7],
                    zip: parts[8]
                },
                phone: phone
            };
            new Person(person).insert(function(err) {
                if (err) console.error(err);
                if (count++ % 100000 === 0) {
                    console.log(count);
                }
                if (count === limit - 1) {
                    process.exit(0);
                }
            });
        });
}

function handleJson(file) {
    fs.readFile(file, {
        encoding: 'utf-8'
    }, function(err, data) {
        var obj = JSON.parse(data);
        var persons = obj.persons;
        var actions = [];
        persons.forEach(function(person) {
            actions.push(function(callback) {
                new Person(person).insert(function(err) {
                    if (err) console.error(err);
                    callback();
                });
            });
        });
        async.parallel(actions, function(err) {
            if (err) console.error(err);
            process.exit(0);
        });
    });
}