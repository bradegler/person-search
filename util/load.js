#!/usr/bin/env node

'use strict';

var fs = require('fs');
var program = require('commander');
var async = require('async');
var Person = require('../server/lib/person').Person;

program
    .version('0.0.1')
    .option('-f, --file <name>', 'file to load')
    .option('-t, --type [type]', 'file type [json, pipe]', 'json')
    .parse(process.argv);

fs.readFile(program.file, {
    encoding: 'utf-8'
}, function(err, data) {
    var persons;
    if (program.type === 'json') {
        persons = handleJson(data);
    } else if (program.type === 'pipe') {
        persons = handlePipe(data);
    }

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

function handlePipe(data) {
    var persons = [];
    var lines = data.split('\n');
    lines.forEach(function(line) {
        var parts = line.split('|');
        var phone;
        if (parts[9].length > 0 && parts[10].length > 0) {
            phone = '(' + parts[9] + ') ' + parts[10].substr(0, 3) + '-' + parts[10].substr(3);
        }
        persons.push({
            id: parts[0],
            name: {
                last: parts[1],
                first: parts[2],
                mid: parts[3],
            },
            dob: parts[4],
            address: {
                line: parts[5],
                city: parts[6],
                state: parts[7],
                zip: parts[8]
            },
            phone: phone
        });
    });
    return persons;
}

function handleJson(data) {
    var obj = JSON.parse(data);
    var persons = obj.persons;
    return persons;
}