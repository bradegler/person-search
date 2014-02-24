'use strict';

var template = require('../hbs/home');
var $ = require('jquery');

function test() {
    console.log("Do something");
    $('#content').html(template({}));
}

test();