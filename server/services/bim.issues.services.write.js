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

//web services (write) of issue api 

'use strict';    
var request = require('request'); 
var fs = require('fs'); 
var path = require('path');

var config = require('../config'); 
 
//create one issue
function createIssues(input) { 
  
  return new Promise(function (resolve, reject) {

    request.post({
      url: config.fieldissuev1.getIssues(input.containerId),
      headers: config.fieldissuev1.httpHeaders(input.credentials.access_token)
      ,
      body: {
        'data': input.data 
      },
      json: true
    },
      function (error, response, body) {

        if (error) {
          reject({ error: error });  
        } else {
           resolve({issueId: body.data.id})  
        }
      }); 
  }); 
}

//create issue comments
function createIssuesComments(input) { 
  
  return new Promise(function (resolve, reject) { 

      request.post({
        url: config.fieldissuev1.createComments(input.containerId),
        headers: config.fieldissuev1.httpHeaders(input.credentials.access_token),
        body: {
          'data': {
            'type': 'comments',
            'attributes': {
              'body': input.body, 'issue_id': input.issue_id
            }
          }
        },
        json: true
      },
        function (error, response, body) {

          if (error) {
            reject({ error: error });   
          } else {
            resolve({})   
          }
        });
  }); 
}

//create issue attachments
function createIssueAttachment(input) {

  return new Promise(function (resolve, reject) {

    request.post({
      url: config.fieldissuev1.createAttachments(input.containerId),
      headers: config.fieldissuev1.httpHeaders(input.credentials.access_token),
      body: {
        'data': {
          'type': 'attachments',
          'attributes': {
            'issue_id': input.issue_id,
            'name': input.attachment_name,
            'urn': input.objectUrn,
            'urn_type': 'oss',
            'urn_version': 1
          }
        }
      },
      json: true
    },
      function (error, response, body) {

        if (error) { 
          reject({error:error});
        } else {
          resolve({attachment_id:body.data.id})
        }
      });
  });
} 

module.exports = {  
  createIssues:createIssues,
  createIssuesComments:createIssuesComments,
  createIssueAttachment:createIssueAttachment
}







 


