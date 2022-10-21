FROM node:16

# Create app directory
WORKDIR /usr/src/strava-3d-stats

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start"]