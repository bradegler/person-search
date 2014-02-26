'use strict';

var redis = require('redis');

var client = redis.createClient();
client.on("error", function(err) {
    console.log("Error " + err);
});
// Removes all redis entries for items whos key matches 
// the passed in pattern
exports.clear = function(pattern, fn) {
    client.keys(pattern, function(err, results) {
        for (var ix = 0; ix < results.length; ix++) {
            client.del(results[ix]);
        }
        //console.log('Removed ' + results.length + ' keys');
        fn(results.length);
    });
};