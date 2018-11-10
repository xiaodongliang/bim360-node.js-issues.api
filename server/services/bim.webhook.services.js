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
var request = require('request'); 
 
var config = require('../config');  
 
function createWebhook(input){

  return new Promise(function(resolve,reject){   
    
    var data =
    {
      callbackUrl: input.webhookCallBackURL,
      scope: {
           folder: input.folderId
      } 
    } 
    request.post({
        url: config.webhook.createWebhook(input.system,input.event), 
        headers: config.webhook.httpHeaders(input.credentials.access_token),
        body: data,
        json: true
      },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else { 
          resolve({}) ;
        }
      });
  })
}
 
function getWebhook(input){

  return new Promise(function(resolve,reject){   
     
    request.get({
        url: config.webhook.getWebhook(input.system,input.event), 
        headers: config.webhook.httpHeaders(input.credentials.access_token),
      },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else { 
          var webhooks = JSON.parse(body).data; 
          var found  = webhooks.filter(function (item) 
              { return item.callbackUrl === input.webhookCallBackURL && 
                item.scope.folder ===  input.folderId; }) 
          if(found && found.length >0){
            if(found[0].status != 'active')
              //will activate again
              resolve({status:'inactive',hookId:found[0].hookId})
            else
              resolve({status:'active',hookId:found[0].hookId}) 
          }else{
            //will create a new one
            resolve({status:'none'}) 
          } 
        } 
      });
  })
}

function patchWebhook(input){

  return new Promise(function(resolve,reject){   
     
    var data =
    {
      status: 'active'
    } 
    request.patch({
        url: config.webhook.patchWebhook(input.system,input.event,input.hookId), 
        headers: config.webhook.httpHeaders(input.credentials.access_token),
        body:   data 
         ,
        json: true
      },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else { 
          resolve({}) ; 
        } 
      });
  })
}


module.exports = { 
  getWebhook:getWebhook,
  createWebhook:createWebhook,
  patchWebhook:patchWebhook
}


 


