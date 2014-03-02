'use strict';

var template = require('../hbs/home');
var tperson = require('../hbs/person');
var $ = require('jquery-browserify');
var Handlebars = require("hbsfy/runtime");

Handlebars.registerPartial('addperson', require("../hbs/partials/addperson.hbs"));

function search() {
    var q = $("#searchterm").val().trim();
    if (q.length > 0) {
        $.getJSON("/api/search?", {
                term: q,
            },
            function(data) {
                $("#results").empty();
                $("#resultSize").empty();
                $("#resultSize").removeClass('alert-success');
                $("#resultSize").removeClass('alert-danger');
                if (data.results.length > 0) {
                    $("#resultSize").append(data.results.length + " results for <b>" + q + "</b>");
                    $("#resultSize").addClass('alert-success');
                } else {
                    $("#resultSize").addClass('alert-danger');
                    $("#resultSize").append("No results for <b>" + q + "</b>");
                }
                $.each(data.results, function(i, person) {
                    $("#results").append(tperson(person));
                });
            });

    } else {
        $("#results").empty();
        $("#resultSize").empty();
    }
}

function init() {
    $.getJSON("/api/stats", {}, function(data) {
        $('#content').html(template(data));
        $("#searchterm").keyup(search);
    });
}

init();