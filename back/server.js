var https = require("https");
var express = require('express');
var app = express();
var keys = require('./environment');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

app.get('/daily/:lat/:long', function (req, res) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    https.get("https://api.darksky.net/forecast/" + keys.darkSkyKey + "/" + req.params.lat + "," + req.params.long, result => {
        result.setEncoding("utf8");
        let body = "";
        result.on("data", data => {
            body += data;
        });
        result.on("end", () => {
            body = JSON.parse(body);
            res.send(body);
        })
    })
})

app.get('/history/:lat/:long/:time', function (req, res) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    https.get("https://api.darksky.net/forecast/" + keys.darkSkyKey + "/" + req.params.lat + ',' + req.params.long + ',' + req.params.time, result => {
        result.setEncoding("utf8");
        let body = "";
        result.on("data", data => {
            body += data;
        });
        result.on("end", () => {
            body = JSON.parse(body);
            res.send(body);
        })
    })
})

app.listen(3000, () => console.log('Listening on port 3000'));