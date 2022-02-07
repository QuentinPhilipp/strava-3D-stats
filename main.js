const strava = require('strava-v3');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 8081;

app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, 'views')));
app.use("/styles", express.static(path.join(__dirname, 'views/styles')))

require('dotenv').config()

strava.config.redirect_uri = process.env.STRAVA_REDIRECT_URI;

app.use(session({
    genid: (req) => {
        return uuidv4();
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // Expire after 1h
        expire: 60000 * 60
    }
}))


function isAuth(req) {
    if (req.session && req.session.userID) {
        return true;
    }
    if (process.env.SKIP_STRAVA_REQUEST == "true") {
        req.session.selectedYear = process.env.TEST_YEAR;
        req.session.athlete = {};
        req.session.athlete.username = "username"
        req.session.athlete.created_at = "2015"
        console.log("Skip authentication");
        return true;
    }
    return false;
}

app.get("/", async function (req, res) {
    if (!isAuth(req)) {
        res.render("index", {authenticated: false});
        req.session.selectedYear = null;
    }  
    else {
        let years = new Array();
        let endDate = new Date().getFullYear();    
        let startDate = new Date(req.session.athlete.created_at).getFullYear();
        for (var i = startDate; i <= endDate; i++) {
            years.push(i)
        }
        let sports = new Array();
        sports.push("All sports");
        sports.push("Cycling");
        sports.push("Running");
        sports.push("Swimming");
        sports.push("Hiking");
        res.render("data", {user: req.session.athlete.username, availableYears: years.reverse(), availableSports: sports});
    }
});

app.get("/coverdata", async (req, res) => {
    result = await getFakeResult("2021");
    res.json({rawData: result, status: "success"});
})

app.get("/data", async (req, res) => {
    selectedYear = req.query.year;
    let rateLimit = strava.rateLimiting.fractionReached()
    console.log("Rate limit before the request:", rateLimit);
    if (selectedYear){
        if (isNaN(rateLimit) || rateLimit < 0.98) {
            if (process.env.SKIP_STRAVA_REQUEST == "true") {
                console.log("Searching fake data for", selectedYear);
                result = await getFakeResult(selectedYear);
        
            }
            else if (req.session[selectedYear]) {
                result = req.session[selectedYear];
            }
            else {
                result = await getYearResult(req, selectedYear);
            }
            res.json({rawData: result, status: "success"});
        }
        else {
            res.json({
                rawData: [], 
                status: 'error',
                errorDesc: "Too many API calls, try again later"
            })
        }
    }
    else {
        res.json({
            rawData: [], 
            status: 'error',
            errorDesc: "Bad request. 'year' field is missing"
        })
    }
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
    processedActivities = processActivities(activities);
    console.log(processedActivities);
    addToCache(processedActivities, year, req.session);
    return processedActivities;
}

function addToCache(data, year, session) {
    session[year] = data;
}

async function getFakeResult(year) {
    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync(`test-files/fake-${year}.json`, 'utf8'));
    return obj;
}

function processActivities(activities) {
    var activitiesProcessed = new Array();
    lastActivity = null;
    activities.forEach(activity => {
        // Special case if there is multiple activities in the same day
        if (lastActivity && sameDay(lastActivity.start_date, activity.start_date) && lastActivity.type === activity.type) {
            lastActivity.distance = parseFloat(activity.distance) + parseFloat(lastActivity.distance)
            lastActivity.moving_time = parseFloat(activity.moving_time) + parseFloat(lastActivity.moving_time)
            lastActivity.elevation = parseFloat(activity.total_elevation_gain) + parseFloat(lastActivity.elevation)
        }
        else {
            let simpleActivity = {
                "start_date": activity.start_date,
                "distance": activity.distance,
                "moving_time": activity.moving_time,
                "elevation": activity.total_elevation_gain,
                "type": activity.type
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

app.get("/logout", async function (req, res) {
    response = await strava.oauth.deauthorize({access_token: req.session.access_token});
    if (response.access_token && response.access_token == req.session.access_token) {
        req.session.destroy();
    }
    res.redirect("/");
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
