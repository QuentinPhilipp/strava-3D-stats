# Strava 3D stats

A web application to create a 3D visualisation of your annual statistics in Strava. 

Check it here: [Strava 3D Stats](https://strava-stats.quentinp.me)

## How to use

- Connect with your Strava account and allow the application to see your activities details.
- Select the metric, the year and the sport you want to see and click on "Create" to generate your activities in 3D
- By default, all sports are displayed for the last year. The default metric is "distance" but you can change it to "elevation"

## Development setup

### NPM setup

Clone project
``` 
$ git clone https://github.com/QuentinPhilipp/strava-3D-stats.git
$ cd strava-3d-stats
```

Setup .env. Duplicate `.env.example` file and rename it `.env`. Change example values with your informations (key, id, etc...).

Install dependencies and run
```
$ npm install
$ npm start
```

### Docker setup

Easier to setup but less easy to work with.

Run docker compose.
```
docker compose up
```

This command will pull my latest image of the software, use the local .env file and run everything in a container. Check localhost:8081 once the container is deployed.
