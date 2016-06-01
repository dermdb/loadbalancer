/*
 *  Copyright 2016 DS-Cubed
 *
 *  Authored by Sam Mills (Henchman) <sam.mills@hench.space>
 *
 *  Project: dermdb https://dermdb.github.io
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('jethro');
var cookieParser = require('cookie-parser');

//Proxy Server
var httpProxy = require('http-proxy');
var proxy = new httpProxy.createProxyServer({});

//Express
var app = express();

var maintenance = false;

//Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger.express);
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

//Proxy API Calls
app.use('/_', function(req, res, next){
    if (maintenance){
        res.json({
            status: "serverError",
            code: 503,
            data: {
                message: "Maintenance"
            }
        })
    } else {
        proxy.web(req, res, {
            target: "http://127.0.0.1:3002"
        }, function (e) {
            res.json({
                status: "serverError",
                code: 503,
                data: {
                    message: "Service Unavailable"
                }
            })
        });
    }
});

//Proxy Standard Calls
app.use(function(req, res, next){
    if (maintenance){
        res.render('error', {
            page: "maintenance"
        });
    } else {
        proxy.web(req, res, {
            target: "http://127.0.0.1:3001"
        }, function (e) {
            var err = new Error("Service Unavailable");
            err.status = 503;
            next(err);
        });
    }
});

app.use(function(err, req, res, next) {
    var code = err.status || 500;
    res.status(code);
    res.render('error', {
        page: code,
        message: err.message,
        error: {}
    });
});


module.exports = app;
