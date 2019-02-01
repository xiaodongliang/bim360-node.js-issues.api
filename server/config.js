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

module.exports = {

  // this this callback URL when creating your client ID and secret
  //set enviroment variables or hard-code here 

   callbackURL: process.env.FORGE_CALLBACK_URL || 'http://localhost:3000/api/forge/callback/oauth',

  // set enviroment variables or hard-code here
  //apply your Forge client credential
  //check Forge help at https://forge.autodesk.com/developer/getting-started
  credentials: {
    client_id: process.env.FORGE_CLIENT_ID || '<your Forge client id>',
    client_secret: process.env.FORGE_CLIENT_SECRET || '<your Forge client secret>'
  },

  //input your website url such as 
  //http://mywebsite.com/webhook/itemAdded
  webhookCallBackURL: process.env.FORGE_WEBHOOK_URL || '<your web host url>/webhook/itemAdded',

  //input your own link for posting message to your own Slack channel
  //check the Slack help:
  //https://api.slack.com/tutorials/slack-apps-hello-world
  slackPostMessageURL:process.env.SLACK_POST_MESSAGE_URL || '<your link of Slack post message>',

  scope: {
    // scope for user 3-legged token
    scopeUserServer: ['data:read', 'data:write', 'data:create'],
    //scope for account Project ,Design Automation,2-legged token
    scopeAdmin: ['data:read',
                'data:write',
                'data:create',
                'data:search',
                'account:read',
                'code:all'], 
    //scope for load forge viewer only, 3-legged token
    scopeUserClient: ['viewables:read']
  },

  //some endpoints have not been packaged with Forge SDK
  //most endpoints of Issue API use the same kind of header
  
  //some endpoints have not been packaged with Forge SDK
  //most endpoints of Issue API use the same kind of header
  
    hqv1: {
      userprofile_useratme: 'https://developer.api.autodesk.com/userprofile/v1/users/@me'
    },
    //Issue API v1
    fieldissuev1: {

      basedUrl: 'https://developer.api.autodesk.com/issues/v1/containers/',
      httpHeaders: function (access_token) {
        return {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'application/vnd.api+json'
        }
      },
      getIssues: function (containerId, filter = '') {
        return this.basedUrl + containerId + '/quality-issues' + filter;
      },
      getComments: function (containerId, issueId) {
        return this.basedUrl + containerId + '/quality-issues/' + issueId + '/comments';
      },
      getAttachments: function (containerId, issueId) {
        return this.basedUrl + containerId + '/quality-issues/' + issueId + '/attachments'
      },
      getOneIssue: function (containerId, issueId) {
        return this.basedUrl + containerId + '/quality-issues/' + issueId;
      },
      createComments: function(containerId) {
        return this.basedUrl + containerId + '/comments';
      },
      createAttachments: function (containerId) {
        return this.basedUrl + containerId + '/attachments';;
      },
      getFieldIssueType:function(containerId){
        return this.basedUrl + containerId + '/issue-types';; 
      },
      getFieldRootCause:function(containerId){
        return this.basedUrl + containerId + '/root-causes';; 
      }
    },

    //when v2 is released, will replace with those new endpoints.
    fieldissuev2: {
      //
    },

    //Design Automation V2
    dav2:{
      
      createWorkItem:function(){
        return 'https://developer.api.autodesk.com/autocad.io/us-east/v2/WorkItems'
      }
    },
    //Design Automation V3 
    dav3:{
      
      createWorkItem:function(){
         return 'https://developer.api.autodesk.com/da/us-east/v3/workitems'
      },
      getWorkItemStatus:function(id){
        return 'https://developer.api.autodesk.com/da/us-east/v3/workitems/'+id
     },
     dwgToPDFActName:'<your activiy name of v3 DA>'
    },
    webhook:{
      httpHeaders: function (access_token) {
        return {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'application/json'
        }
      },
      getWebhook:function(system,event){
        return 'https://developer.api.autodesk.com/webhooks/v1/systems/'+
        system +
        '/events/'+
        event+
        '/hooks'; 
      },
      createWebhook:function(system,event){
        return 'https://developer.api.autodesk.com/webhooks/v1/systems/'+
        system +
        '/events/'+
        event+
        '/hooks'; 
      },
      patchWebhook:function(system,event,hookId){
        return 'https://developer.api.autodesk.com/webhooks/v1/systems/'+
        system +
        '/events/'+
        event+
        '/hooks/'+
        hookId; 
      },
      deleteWebHook:function(){

      }
    }
   
};
