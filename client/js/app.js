'use strict';

var template = require('../hbs/home');
var tperson = require('../hbs/person');
var $ = require('jquery');

function search() {
    var q = $("#searchterm").val().trim();
    if (q.length > 0) {
        $.getJSON("/api/search?", {
                term: q,
            },
            function(data) {
                $("#results").empty();
                $("#results").append("<div class='row'>" + data.results.length + " results for <b>" + q + "</b>");
                $("#results").append("<div class='row'>");
                $.each(data.results, function(i, person) {
                    $("#results").append(tperson(person));
                });
                $("#results").append("</div>");
            });

    } else {
        $("#results").empty();
    }
}

function init() {
    $.getJSON("/api/stats", {}, function(data) {
        $('#content').html(template(data));
        $("#searchterm").keyup(search);
        $("#search").click(search);
    });
}

init();