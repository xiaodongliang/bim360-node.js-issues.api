/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////
'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();

// this session will be used to save the oAuth token
app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy - HTTPS on Heroku 
app.use(session({
  secret: 'autodeskforge',
  cookie: {
    httpOnly: true,
    secure: (process.env.NODE_ENV === 'production'),
    maxAge: 1000 * 60 * 60 // 1 hours to expire the session and avoid memory leak
  },
  resave: false,
  saveUninitialized: true
}));

// prepare server routing
app.use('/', express.static(__dirname + '/../www')); // redirect static calls
 
app.set('port', process.env.PORT || 3000); // main port

// prepare our API endpoint routing
var oauth = require('./endpoints/oauth.endpoints');
var dm = require('./endpoints/dm.endpoints.js');
var bimissuesbasic = require('./endpoints/bim.issues.endpoints.basic.js');
var bimissuereport = require('./endpoints/bim.issues.endpoint.report');
var bimissuecsv = require('./endpoints/bim.issues.endpoint.csv');
var bimissuesintegration = require('./endpoints/bim.issues.endpoints.integration');
var bimwebhook = require('./endpoints/bim.webhook.endpoints');


app.use('/', oauth); // oauth workflow
app.use('/', dm); // BIM hub,projects,folder,files
app.use('/', bimissuesbasic); // BIM Issue API basic demos
app.use('/', bimissuereport); // BIM Issue statistic 
app.use('/', bimissuecsv); // BIM Issue export customized CSV  
app.use('/', bimissuesintegration); // export DWG to PDF (create issue with failure job)
app.use('/', bimwebhook); // webhook

module.exports = app;