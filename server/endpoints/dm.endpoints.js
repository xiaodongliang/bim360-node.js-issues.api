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
var router = express.Router();
 
 
var UserSession = require('../services/userSession');
var oAuthServices = require('../services/oauth.services'); 
var hubsServices = require('../services/dm.hubs.services');
var projectsServices = require('../services/dm.projects.services');
var bimIssuesServicesRead = require('../services/bim.issues.services.read'); 
var bimDatabase = require('../bim.database');


router.get('/dm/getTreeNode', function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var input = {
    oAuth:userSession.getUserServerOAuth(),
    credentials:userSession.getUserServerCredentials()
  }

  var href = decodeURIComponent(req.query.id);

  if (href === '#') {  
    hubsServices.getHubs(input).then(function(result){
      res.json(result.hubs);  
      //dump hub info such as users list
      getAllHubsInfo(result.hubs); 
    }).catch(function(result){
      res.status(500).json(result.error); 
    }) 

  } else {
      var params = href.split('/');
      var resourceName = params[params.length - 2];
      var resourceId = params[params.length - 1];
    switch (resourceName) {
      case 'hubs':
        //filter BIM 360 hub only
        if (resourceId.substr(0, 2) == 'b.'){
          input.hubId = resourceId;
          projectsServices.getProjects(input).then(function(result){ 
            res.json(result.projects);  
            //dump projects info
            getAllProjectContent(result.projects,input);
            
          }).catch(function(result){
            res.status(500).end(); 
          }) 
        }
         break;
      case 'projects':
        var hubId = params[params.length - 3];
        var projectId = resourceId; 
        var contents = bimDatabase.getProjectRootContents(hubId,projectId);
        if(contents) 
           res.json(contents);
        else 
           res.status(500).end();   
        break;
      case 'folders':
        var projectId = params[params.length - 3];
        input.projectId = projectId;
        input.folderId = resourceId;
        projectsServices.getFolderContents(input).then(function(result){ 
          res.json(result.contents);  
        }).catch(function(result){
          res.status(500).end(); 
        }) ;
        break;
      case 'items':
        var projectId = params[params.length - 3];
        input.projectId = projectId;
        input.itemId = resourceId;

        projectsServices.getVersions(input).then(function(result){ 
          res.json(result.versions);  
        }).catch(function(result){
          res.status(500).end(); 
        }) ;
        break;
    }
  }
});


// return name & picture of the user for the front-end
// the forge @me endpoint returns more information
router.get('/user/profile', function (req, res) {
  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }
  var input={credentials:userSession.getUserServerCredentials()};

  hubsServices.getUserProfile(input).then(function(result){
    res.json(result.profile);
  }).catch(function(e){
    res.status(500).json(e.error); 
  })   
});
 

function getAllHubsInfo(hubs) {

  oAuthServices.getAdminTwoLeggedToken().then(function(result){

    hubs.forEach(item => {

      var href = decodeURIComponent(item.id);
      var params = href.split('/');
      var hubId = params[params.length - 1]; 
      item.hubId = hubId;
   
      bimDatabase.addOneHub(hubId);

      var input={
        access_token:result.credentials.access_token, 
        accountId:hubId.substr(2, hubId.length - 1) //remove b. 
      } 
      var allUsers = [];
      hubsServices.getHQUsersList(input,allUsers,0).then(function(result){
        bimDatabase.refreshUsers(hubId,result);
      }) 
    });  
  }) 
}

function getAllProjectContent(projects,userServerToken) {

  oAuthServices.getAdminTwoLeggedToken().then(function(adminToken){

    projects.forEach(item => {

      var href = decodeURIComponent(item.id);
      var params = href.split('/');
      var hubId = params[params.length - 3];
      var projectId = params[params.length - 1];
   
      bimDatabase.addOneProject(hubId,projectId); 

      var subInput={
        userServerToken:userServerToken,

        oAuth:userServerToken.oAuth,
        credentials:userServerToken.credentials,

        hubId:hubId,
        projectId:projectId,

        adminToken:adminToken 
      }; 

      projectsServices.getProject(subInput)
        .then(function (result) {

          console.log('refreshing container id and root folder id of one project')
          var rootFolderId = result.projectInfo.relationships.rootFolder.data.id;
          var issuesContainerId = result.projectInfo.relationships.issues.data.id;
          subInput.containerId = issuesContainerId 

          bimDatabase.refreshProjectInfo(hubId,projectId,
            {rootFolderId:rootFolderId,
            issuesContainerId:issuesContainerId,
            projectName:result.projectInfo.attributes.name})

          subInput.folderId = rootFolderId
          subInput.oAuth = subInput.adminToken.oAuth;
          subInput.credentials = subInput.adminToken.credentials;

          return projectsServices.getFolderContents(subInput);
        })
        .then(function (result) {
          console.log('refreshing photos folder id of one project') 

          bimDatabase.refreshProjectInfo(hubId,projectId,
            {rootFolderContents:result.contents})

          return hubsServices.getProjectCompanies(subInput); 
        })
        .then(function (result) {
          console.log('refreshing companies of one project') 
          bimDatabase.refreshProjectInfo(hubId,projectId,{companies:result.companies })
          return hubsServices.getProjectRoles(subInput); 
        })
        .then(function (result) {
          console.log('refreshing roles of one project') 
          bimDatabase.refreshProjectInfo(hubId,projectId,{roles:result.roles })
 
          subInput.oAuth = subInput.userServerToken.oAuth;
          subInput.credentials = subInput.userServerToken.credentials;
          return bimIssuesServicesRead.getFieldIssueTypes(subInput);
        })
        .then(function (result) {
          console.log('refreshing field issue types of one project') 
          bimDatabase.refreshProjectInfo(hubId,projectId,{fieldIssueTypes:result.fieldIssueTypes })
 
          return bimIssuesServicesRead.getFieldRootCause(subInput);
        })  
        .then(function (result) {
          console.log('refreshing field root causes of one project') 
          bimDatabase.refreshProjectInfo(hubId,projectId,{fieldRootcauses:result.fieldRootcauses })
          console.log('one project dump succeeded!'); 

        }) 
        .catch(function (error) {
          console.log('one project dump failed!');
        }); 
    })  
  })  
} 
 


module.exports =  router 
 

