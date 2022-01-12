const strava = require('strava-v3');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

var year = 2021;
const startDate = new Date(year,0,1);  //month 0 = January
const endDate = new Date(year,11,31,23,59,59);

console.log(startDate.getTime() / 1000, "\n",endDate.getTime() / 1000);

require('dotenv').config()

strava.config.redirect_uri = process.env.STRAVA_REDIRECT_URI;

app.use(session({
    genid: (req) => {
        return uuidv4();
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))

app.get("/", function (req, res) {
    console.log("Session", req.sessionID);
    res.sendFile(path.join(__dirname+'/static/index.html'));
});

app.get("/login", function (req, res) {
    res.redirect(strava.oauth.getRequestAccessURL({scope: "activity:read_all"}));
});


app.get("/rawData", function (req, res) {
    if (!req.session.user) {
        res.redirect("/");
    }
    let stravaClient = new strava.client(req.session.access_token);
    const payload = stravaClient.athlete.listActivities({
        per_page: 100,
        after: startDate.getTime() / 1000,
        before: endDate.getTime() / 1000
    }, (err, payload, limits) => {
        if (!err) {
            res.json(payload)
        } else {      
            console.error(err);    
            res.sendFile(path.join(__dirname+'/static/data.html'));
        }
    })
})


app.get("/data", function (req, res) {
    console.log(req.session.user);
    console.log(req.session.access_token);
    if(!req.session.user) {
        console.log("User not authenticated");
        res.sendFile(path.join(__dirname+'/static/data.html'));
    }
    else{
        console.log(`Hello athlete ${req.session.user}`);
        res.redirect("/rawData");
    }
})


app.get("/exchange_token", (req, res) => {
    // Get short-lived access_token from Strava based on received code and scope
    let authenticationCode = req.query.code;
    let scope = req.query.scope;
    console.log(authenticationCode, scope);

    if (scope.includes("activity:read_all") && scope.includes("read")) {
        // Correct scope, continue login workflow
        strava.oauth.getToken(authenticationCode, function (err, payload, connectionIds) {
            console.log("Ids:", connectionIds);
            // TODO: Complete error handling
            req.session.user = connectionIds.athlete.id;
            req.session.access_token = connectionIds.access_token;
            res.redirect("/data");
        });
    }
    else {
        console.log("Scope not validated by user");
        // TODO: Complete error handling
        res.redirect("/login");
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
