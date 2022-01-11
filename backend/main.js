var strava = require('strava-v3');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

require('dotenv').config()

strava.config.access_token = process.env.STRAVA_ACCESS_TOKEN;
strava.config.client_id = process.env.STRAVA_CLIENT_ID;
strava.config.client_secret = process.env.STRAVA_CLIENT_SECRET;
strava.config.redirect_uri = process.env.STRAVA_REDIRECT_URI;

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname+'/static/index.html'));
});

app.get("/login", function (req, res) {
    res.redirect(strava.oauth.getRequestAccessURL({scope: "activity:read_all"}));
});


app.get("/exchange_token", (req, res) => {
    // Get short-lived access_token from Strava based on received code and scope
    let authenticationCode = req.query.code;
    let scope = req.query.scope;
    console.log(authenticationCode, scope);

    if (scope === "activity:read_all") {
        // Correct scope, continue login workflow
        strava.oauth.getToken(code, function (err, payload, connectionIds) {
            console.log("Ids:", connectionIds);
            // TODO: Complete error handling
        });
    }
    else {
        console.log("Scope not validated by user");
        // TODO: Complete error handling
    }
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
