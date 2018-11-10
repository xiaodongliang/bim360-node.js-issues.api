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

// token handling in session
var token = require('../services/userSession');

// web framework
var express = require('express');
var request = require('request');

var router = express.Router(); 

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json(); 
var url = require('url');  

var config = require('../config');  
var UserSession = require('../services/userSession'); 
var webhookServices = require('../services/bim.webhook.services');   
 

//do the job of workitem
router.get('/webhook/buildWebhook', jsonParser,function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).json({error:'Please login first'});
    return;
  } 
 

  //get submited parameters
  var args = url.parse(req.url, true).query;

   var input ={
      folderId:args.folderId,
      credentials:userSession.getUserServerCredentials(), 
      webhookCallBackURL:config.webhookCallBackURL,
      system:'data',
      event:'dm.version.added'
   };   

   webhookServices.getWebhook(input).then(function(result){ 

        if(result.status == 'inactive'){
          input.hookId = result.oAuth; 
          return webhookServices.patchWebhook(input)
        }else if(result.status == 'none'){
          return webhookServices.createWebhook(input) 
        }else{
          return;
        } 
   })
    .then(function(result){
      
        console.log('webhook is built successfully');
        res.status(200).json({}); 

    }) 
    .catch(function (result) { 
      console.log('something failed when building webhook');
      res.status(500).json({error:'webhook failed!'}); 

     }); 
});

router.post('/webhook/itemAdded',jsonParser, function (req, res) { 
  console.log('info from Autodesk BIM 360 folder: ' + req);
  res.status(200).end();

  if(req.body){
    var fileName = req.body.payload.name;
    if (getFileExtension(fileName) == 'log'){

      var issueId = fileName.substring(0,fileName.length-4);
      postMessageToSlack({projectId:req.body.payload.project,issueId:issueId});
    }

  }
});  

function postMessageToSlack(input){
  var data =
    {
      "attachments": [
          {
              "fallback": "Issue of Export DWG to PDF in BIM 360",
              "color": "#2eb886",
              "pretext": "This is a notification from BIM 360",
              "author_name": "Xiaodong Liang",
              "author_link": "http://flickr.com/bobby/",
              "author_icon": "http://flickr.com/icons/bobby.jpg",
              "title": "Issue of Export DWG to PDF in BIM 360",
              "title_link": 'https://field.b360.autodesk.com/projects/'+input.projectId+'/issues?preview='+input.issueId,
              "text": "Please click the title to check the Issue in BIM 360",
              "fields": [
                  {
                      "title": "Priority",
                      "value": "High",
                      "short": false
                  }
              ],
              "image_url": "http://my-website.com/path/to/image.jpg",
              "thumb_url": "http://example.com/path/to/thumb.png",
              "footer": "Slack API",
              "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
              "ts": 123456789
          }
      ]
  }
  request.post({
      url: config.slackPostMessageURL,
      body: data,
      json: true
    },
    function (error, response, body) {

      if (error) {
         console.log('post message to Slack failed')
      } else { 
        console.log('post message to Slack succeeded')  
      }
    });
}

function getFileExtension(filename) {
  return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
} 

module.exports = router; 
