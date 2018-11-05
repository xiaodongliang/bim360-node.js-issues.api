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
var fs = require('fs'); 
var path = require('path');
var url = require('url');  
    
var utility = require('../utility');

var UserSession = require('../services/userSession');
var oAuthServices = require('../services/oauth.services'); 
var projectsServices = require('../services/dm.projects.services');
var bimIssuesServicesWrite = require('../services/bim.issues.services.write'); 
var daServices = require('../services/da.services');  
var bimDatabase = require('../bim.database'); 
var utility = require('../utility'); 
 

//do the job of workitem
router.get('/integration/startjob', jsonParser,function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).json({error:'Please login first'});
    return;
  } 

  var params = req.query.projectHref.split('/');
  var projectId = params[params.length - 1];

  //generate a random ID to identify this job
  var jobId = utility.randomValueBase64(6);  
  //intial status of work item   
  utility.storeStatus(jobId,JSON.stringify({ status:'calculating'})) 
  //send the job id to client for checking status
  res.status(200).json({jobId:jobId});  

  //get submited parameters
  var args = url.parse(req.url, true).query;

   var input ={
      jobId:jobId,
      userServeroAuth:userSession.getUserServerOAuth(),
      userServerCredentials:userSession.getUserServerCredentials(),
      projectId:projectId,
      sourceFolderId:args.sourceFolderId,
      targetFolderId:args.targetFolderId,
      actString:args.actString,
      filesArray:[]
   };   

   oAuthServices.getAdminTwoLeggedToken().then(function(result){ 
        input.adminoAuth = result.oAuth;
        input.adminCredentials = result.credentials;
        return projectsServices.getFolderContents(
          { projectId:input.projectId,
            oAuth:input.adminoAuth,
            credentials:input.adminCredentials,
            folderId:input.sourceFolderId})
   })
    .then(function(result){
      input.filesArray = result.contents;
      utility.storeStatus(jobId,JSON.stringify(
                                      {status:'migrating',
                                      allFiles:result.contents.length,
                                      migrated:[],
                                      failed:[],
                                      exception:[]})) 
      startWorkflow(input);
    })  
    .catch(function (result) { 
      console.log('something failed when calculating files in source folder:');
      utility.storeStatus(jobId,JSON.stringify({status:'failed'}))
    }); 
});

router.get('/integration/checkjob',jsonParser, function (req, res) { 

  var args = url.parse(req.url, true).query;
  var status = utility.readStatus(args.jobId)
  if(status) 
    res.status(200).json({status:status});  
  else
    res.status(500).json({error:'no such status!' + args.jobId }); 
});  
 

function startWorkflow(input){  

  input.filesArray.forEach(function(el) {  

        var sourceItemHref = el.id;
        var params = el.id.split('/');
        var sourceItemId = params[params.length - 1];

        var eachInput={
          oAuth:input.adminoAuth,
          credentials:input.adminCredentials,
          projectId: input.projectId,
          sourceFolderId:input.sourceFolderId,
          targetFolderId:input.targetFolderId,
          sourceFileName:el.text,
          resultFileName:input.actString.includes('pdf')?el.text + '.pdf':el.text,
          actString:input.actString,
          sourceItemHref:sourceItemHref,
          sourceItemId:sourceItemId,
          jobId:input.jobId
        } 
        
        projectsServices.getItemStorage(
          { oAuth:eachInput.oAuth,
            credentials:eachInput.credentials,
            projectId:eachInput.projectId,
            itemId:eachInput.sourceItemId})
        .then(function(result){

          eachInput.sourceItemStg= result.itemStg;

           return projectsServices.createStorage(
             {oAuth:input.adminoAuth,
              credentials:input.adminCredentials,
              newFileName:eachInput.resultFileName,
              projectId:input.projectId,
              folderId:input.targetFolderId
              });
        }).then(function(result){ 
 
           var params = result.newFileObjUrn.split('/');
          var resourceId = params[params.length - 1];
          eachInput.newFileObjUrn =  result.newFileObjUrn;
          eachInput.outputItemStg = 'https://developer.api.autodesk.com/oss/v2/buckets/wip.dm.prod/objects/'+resourceId;
           
 
          if(eachInput.actString.includes('v2'))
            return daServices.createDAWorkItemV2(eachInput);
          

        }).then(function(result){  

          if(result.status == 'failed') {

            updateSatus(eachInput.jobId,eachInput.sourceItemHref,'failed'); 

            //start to create issue.switch to 3 legged token
            eachInput.oAuth = input.userServeroAuth;
            eachInput.credentials = input.userServerCredentials;
            eachInput.logFileName = result.logFileName;
            eachInput.cloudHref = result.logFileHref;
            eachInput.workitemId = result.workitemId;

            daServices.downloadReport(eachInput.logFileName,eachInput.cloudHref)
            .then(function(result){   
                eachInput.newFileName = eachInput.workitemId + '.log' 
                eachInput.folderId = eachInput.targetFolderId  
                eachInput.file_full_path_name = __dirname + '/../downloads/' + eachInput.newFileName;
                return projectsServices.createOneItem(eachInput); 

             }).then(function(result){  
              eachInput.newFileObjUrn = result.newFileObjUrn;
               eachInput.containerId = bimDatabase.getIssueContainerId(eachInput.projectId);
                var one_date = new Date();
               one_date = one_date.getFullYear() 
                         +'-' + (one_date.getMonth() +1)
                         + '-' +(one_date.getDate()+1);
         
               var data = {
                type: 'quality_issues',
                      attributes: { 
                          'title':eachInput.sourceFileName + ' failed to be migrated',
                          'description':input.sourceFileName + ' failed to be migrated. Please check the attached log file',
                          'status':'open',
                          'assigned_to':'7462015',
                          'assigned_to_type':'role',
                          'due_date':one_date, 
                          'ng_issue_type_id': 'd73dc282-8ff3-44cb-9db9-84e92fdfe024', //hard-coded for simple demo
                          'ng_issue_subtype_id': '202d59b1-1c2b-4270-824c-d53f3c3754bc',//hard-coded for simple demo
                          'root_cause_id': 'aff4b70b-54aa-4e13-92b4-49caf542bef4'//hard-coded for simple demo
                       
                  } 
                }

               eachInput.data = data;
               return bimIssuesServicesWrite.createIssues(eachInput)

             }).then(function(result){ 
              eachInput.attachment_name = eachInput.newFileName;
              eachInput.objectUrn = eachInput.newFileObjUrn;
              eachInput.issue_id = result.issueId;

              return bimIssuesServicesWrite.createIssueAttachment(eachInput); 
              }).then(function(result){

                console.log('one issue for failed workitem is created.')
              }).catch(function (result) {  
              return;
             });   
           }
          else if(result.status == 'done'){
            updateSatus(eachInput.jobId,eachInput.sourceItemHref,'migrated'); 

            //post item only because the file has been uploaded to storage
             //eachInput.oAuth = input.userServeroAuth;
             //eachInput.credentials = input.userServerCredentials;
             eachInput.newFileName = eachInput.resultFileName
             eachInput.folderId = eachInput.targetFolderId 
             
             projectsServices.postItem(eachInput).then(function(result){
               return;
              }).catch(function (result) {  
                return;
             }); 
           }
           else if(result.status == 'exception'){
             //do nothing, save status only
             return;
           }
        }).then(function(result){   
           
        }).catch(function (result) {
          updateSatus(eachInput.jobId,eachInput.sourceItemHref,'exception');  
        }); 
     
  }); 
} 

function updateSatus(jobId,sourceItemHref,status){
   //store status
   var oldStatus = utility.readStatus(jobId);
   if(oldStatus){
     var s = JSON.parse(oldStatus)
     switch(status)
     {
       case 'migrated':
        s.migrated.push(sourceItemHref);
       break;
       case 'failed':
       s.failed.push(sourceItemHref); 
       break; 
       case 'exception':
       s.exception.push(sourceItemHref); 
       break; 
     }
     utility.storeStatus(jobId,JSON.stringify(s));
   } 
}

module.exports = router; 
