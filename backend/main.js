const strava = require('strava-v3');
require('dotenv').config()

console.log(process.env.STRAVA_ACCESS_TOKEN, process.env.STRAVA_CLIENT_ID, process.env.STRAVA_CLIENT_SECRET);

async function test() {
    const payload = await strava.athlete.get({'access_token': process.env.STRAVA_ACCESS_TOKEN}, function(err, payload, limits) {
        console.log("Error: ", err);
        console.log("Payload: ", payload);
        console.log("Limits: ", limits);
    })
}

test();