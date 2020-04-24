const express = require('express');

const emailer = require('./routes/emailer');
const http = require('http');

const app = express();

app.set('port', process.env.PORT || 8443);
app.set('trust proxy', true);
app.set('trust proxy', 'loopback');

app.use('/', emailer);

// Run server
http.createServer(app)
    .listen(app.get('port'), () => console.log("Presto email service started correctly!"));