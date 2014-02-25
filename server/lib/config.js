'use strict';

// Configuration data
var fs = require('fs');
var path = require('path');

var raw = fs.readFileSync(path.join(__dirname, '../config.json'), {
    encoding: 'utf-8'
});
var Config = JSON.parse(raw);

console.log(JSON.stringify(Config));

exports.get = function() {
    return Config;
};