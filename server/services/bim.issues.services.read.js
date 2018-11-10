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

//web services (read) of issue api 

'use strict';    
var request = require('request'); 
var config = require('../config'); 
var utility = require('../utility');

//get issue types and sub types
 function getFieldIssueTypes(input) { 

  return new Promise(function (resolve, reject) {
    
    request.get({
        url: config.fieldissuev1.getFieldIssueType(input.containerId), 
        headers: config.fieldissuev1.httpHeaders(input.credentials.access_token),
      },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else {
          resolve({fieldIssueTypes:JSON.parse(body).data});
        }
      });
  });
}

//get root causes list of field issue
function getFieldRootCause(input) {

  return new Promise(function (resolve, reject) {
    
    request.get({
      url: config.fieldissuev1.getFieldRootCause(input.containerId), 
      headers: config.fieldissuev1.httpHeaders(input.credentials.access_token),
    },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else {
           resolve({fieldRootcauses:JSON.parse(body).data});        }
      });
  });
}

//get issues by due date filter
function getIssues(input) { 
  
  return new Promise(function (resolve, reject) {
    
    var urlFilter = input.filter.due_date ? '?filter[due_date]=' + 
    input.filter.due_date + '...' + input.filter.one_day_late : '';

    request.get({
        url: config.fieldissuev1.getIssues(input.containerId,urlFilter), 
        headers: config.fieldissuev1.httpHeaders(input.credentials.access_token),
      },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else {
          
          var issuesArray = JSON.parse(body).data;

          var issues = [];
          issuesArray.forEach(function (item) {

            var title = item.attributes.title == null ? '<No Title>' : item.attributes.title;
            issues.push(utility.prepareItemForIssueTree(
              item.links.self,
              title,
              item.type,
              true,
              { containerId: input.containerId, issueId: item.id }
            ));
          });
          resolve({issues:issues}) ;
        }
      });
  }); 
}

//get issues of one page
function getIssuesOnePage(input) { 
  
  return new Promise(function (resolve, reject) {
    
    var urlFilter = input.pageoffset !=null ? '?page[offset]=' + input.pageoffset:'';
    if(urlFilter.length) 
        urlFilter+= '&page[limit]=5'; 

    request.get({
        url: config.fieldissuev1.getIssues(input.containerId,urlFilter), 
        headers: config.fieldissuev1.httpHeaders(input.credentials.access_token),
      },
      function (error, response, body) {

        if (error) {
           reject({ error: error });
        } else {
          
            var issues = JSON.parse(body).data; 
          resolve({issues:issues}) ;
        }
      });
  }); 
}

//get comments of specific issue
function getIssueComments(input) {

  return new Promise(function (resolve, reject) {

    request.get({
      url: config.fieldissuev1.getComments(input.containerId, input.issueId),
      headers: config.fieldissuev1.httpHeaders(input.credentials.access_token)
    },
    function (error, response, body) {

      if (error) {
        reject({ error: error });
      } else {

        var commentsArray = JSON.parse(body).data;
        var comments= [];

        commentsArray.forEach(function (item) {

          comments.push(utility.prepareItemForIssueTree(
            item.id,
            'comments: ' + item.attributes.created_at,
            item.type,
            true,
            {
              create_at: item.attributes.created_at,
              body: item.attributes.body,
              updated_at: item.attributes.updated_at,
              created_by: item.attributes.created_by,
            }
          ));
        });
        resolve({comments:comments}) ; 
       }
    });
  });
}

//get attachments of specific issue
function getIssueAttachments(input) {

  return new Promise(function (resolve, reject) {

    request.get({
      url: config.fieldissuev1.getAttachments(input.containerId, input.issueId),
      headers: config.fieldissuev1.httpHeaders(input.credentials.access_token)
    },
      function (error, response, body) {

        if (error) {
          reject({ error: error });
        } else {

          var attachmentsArray = JSON.parse(body).data;
          var attachments = [];

          attachmentsArray.forEach(function (item) {

            attachments.push(utility.prepareItemForIssueTree(
              item.attributes.url,
              item.attributes.name,
              item.type,
              false,
              {
                create_at: item.attributes.created_at,
                updated_at: item.attributes.updated_at,
                created_by: item.attributes.created_by,
                urn: item.attributes.urn
              }
            ));
          });
          resolve({attachments:attachments}) ; 
        }
      });
    });
}

//get issues basic attributes
function getAttributes(input) {

return new Promise(function (resolve, reject) {

  request.get({
    url: config.fieldissuev1.getOneIssue(input.containerId, input.issueId), 
    headers: config.fieldissuev1.httpHeaders(input.credentials.access_token)
  },
    function (error, response, body) {

      if (error) {
        reject({ error: error }); 
      } else {

        var issuedata = JSON.parse(body).data;
        var attributesArray = issuedata.attributes;

        var attributes = [];

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'title: ' + attributesArray.title,
          'attributes',
          false
        ));

        //build the json tree for other modules
        attributes.push(utility.prepareItemForIssueTree(
          '',
          'description: ' + attributesArray.description,
          'attributes',
          false
        ));

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'status: ' + attributesArray.status,
          'attributes',
          false
        ));

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'root_cause: ' + attributesArray.root_cause,
          'attributes',
          false
        ));

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'issue_type: ' + utility.findIssueType(input.containerId, attributesArray.issue_type),
          'attributes',
          false
        ));

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'assigned_to: ' + attributesArray.assigned_to,
          'attributes',
          false
        ));

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'assigned_to_type: ' + attributesArray.assigned_to_type,
          'attributes',
          false
        ));
        attributes.push(utility.prepareItemForIssueTree(
          '',
          'created_at: ' + attributesArray.created_at,
          'attributes',
          false
        ));
        attributes.push(utility.prepareItemForIssueTree(
          '',
          'due_date: ' + attributesArray.due_date,
          'attributes',
          false
        ));

        attributes.push(utility.prepareItemForIssueTree(
          '',
          'answer: ' + attributesArray.answer,
          'attributes',
          false
        ));
        attributes.push(utility.prepareItemForIssueTree(
          '',
          'answered_at: ' + attributesArray.answered_at,
          'attributes',
          false
        ));
        attributes.push(utility.prepareItemForIssueTree(
          '',
          'answered_by: ' + attributesArray.answered_by,
          'attributes',
          false
        ));

        if (attributesArray.pushpin_attributes != null) {
          attributes.push(utility.prepareItemForIssueTree(
            'pushpin',
            'push_pin: ' + attributesArray.pushpin_attributes.object_id,
            'pushpin',
            true,
            issuedata
          ));
        } 
        resolve({attributes:attributes}) ; 
      }
    });
  });
}
  
function getOneIssueComments(input){
 
  return new Promise((resolve,reject)=>{

    var headers = {
      Authorization: 'Bearer '+ input.credentials.access_token,
      'Content-Type': 'application/vnd.api+json' 
    }
  
    var requestUrl = input.isDocIssue?
    'https://developer.api.autodesk.com/issues/v1/containers/' 
    + input.containerId + '/issues/'+input.issueId +'/comments'
    :
    'https://developer.api.autodesk.com/issues/v1/containers/' 
    + input.containerId + '/quality-issues/'+input.issueId +'/comments'

    request.get({
      url: requestUrl,
      headers: headers 
     },
    function (error, response, body) {
  
      if (error) {
        console.log(error);
        reject({error:error});
       }else{  
        var commentsArray = JSON.parse(body).data;  
        resolve(commentsArray); 
      }   
    });  
  });
}

module.exports = { 
  getFieldIssueTypes:getFieldIssueTypes,
  getFieldRootCause:getFieldRootCause,
  getIssues:getIssues,
  getIssueComments:getIssueComments,
  getIssueAttachments:getIssueAttachments,
  getAttributes:getAttributes,
  getOneIssueComments:getOneIssueComments,
  getIssuesOnePage:getIssuesOnePage
 }







 


