'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, '../dist')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

fs.readdirSync(path.join(__dirname, '/routes')).forEach(function(file) {
    if (file.substr(-3) == '.js') {
        var route = require('./routes/' + file);
        route.load(app);
    }
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});