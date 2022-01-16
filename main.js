const strava = require('strava-v3');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 8081;

app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, 'views')));
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


function isAuth(req) {
    if (req.session && req.session.userID) {
        return true;
    }
    return false;
}



app.get("/", async function (req, res) {
    let selectedYear = req.query.year
    if (selectedYear) {
        req.session.selectedYear = selectedYear;
    }
    if (!isAuth(req)) {
        res.render("index", {authenticated: false});
        req.session.selectedYear = null;
    }
    else if (!req.session.selectedYear){
        let years = new Array();
        let endDate = new Date().getFullYear();
        let startDate = new Date(req.session.athlete.created_at).getFullYear();
        for (var i = startDate; i <= endDate; i++) {
            years.push(i)
        }
        res.render("index", {authenticated: true, username: req.session.athlete.firstname, availableYears: years.reverse()});
        req.session.selectedYear = null;
    }        
    else {
        res.render("data", {selectedYear: selectedYear});
    }
});

app.get("/data", async (req, res) => {
    selectedYear = req.session.selectedYear;
    result = await getYearResult(req, selectedYear);
    res.json({rawData: result});
})

async function getYearResult(req, year) {
    const startDate = new Date(year,0,1);  //month 0 = January
    const endDate = new Date(year,11,31,23,59,59);

    const maxRequestPerPage = 100;
    const maxRetry = 10; 

    let stravaClient = new strava.client(req.session.access_token);

    var activities = new Array();
    let activityResponse = await stravaClient.athlete.listActivities({
        per_page: maxRequestPerPage,
        after: startDate.getTime() / 1000,
        before: endDate.getTime() / 1000
    });
    activities.push(...activityResponse);

    // If there is 100 activities returned, there might be more activities to fetch. Continue to fetch 
    // until the returned payload is not the same size as the requested size.
    let retryCount = 0;
    while ((activityResponse.length == maxRequestPerPage) && (maxRetry>retryCount)) {
        activityResponse = await stravaClient.athlete.listActivities({
            per_page: maxRequestPerPage,
            after: startDate.getTime() / 1000,
            before: endDate.getTime() / 1000,
            page: retryCount + 2  // Page 1 already requested before the while loop
        });
        activities.push(...activityResponse);
        retryCount = retryCount + 1;
    }
    return processActivities(activities);
}


function processActivities(activities) {
    var activitiesProcessed = new Array();
    lastActivity = null;
    activities.forEach(activity => {
        // Special case if there is multiple activities in the same day
        if (lastActivity && sameDay(lastActivity.start_date, activity.start_date)) {
            lastActivity.distance = parseFloat(activity.distance) + parseFloat(lastActivity.distance)
        }
        else {
            let simpleActivity = {
                "start_date": activity.start_date,
                "distance": activity.distance
            }
            activitiesProcessed.push(simpleActivity);
            lastActivity = simpleActivity;
        }        
    });
    return activitiesProcessed;
}


app.get("/login", function (req, res) {
    res.redirect(strava.oauth.getRequestAccessURL({scope: "activity:read_all"}));
});

app.get("/exchange_token", (req, res) => {
    // Get short-lived access_token from Strava based on received code and scope
    let authenticationCode = req.query.code;
    let scope = req.query.scope;

    if (scope.includes("activity:read_all") && scope.includes("read")) {
        // Correct scope, continue login workflow
        strava.oauth.getToken(authenticationCode, function (err, payload, connectionIds) {
            if (connectionIds.errors && connectionIds.errors.length > 0) {
                console.log(connectionIds.errors);
            }
            else {
                // TODO: Complete error handling
                req.session.userID = connectionIds.athlete.id;
                req.session.athlete = connectionIds.athlete;
                req.session.access_token = connectionIds.access_token;
                res.redirect("/");
            }
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


const sameDay = (first, second) => {
    var firstDay = new Date(first);
    var secondDay = new Date(second);
    return firstDay.getMonth() === secondDay.getMonth() && firstDay.getDate() === secondDay.getDate()
}

// 49930.4