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


// web framework
var express = require('express');
var request = require('request');

var router = express.Router();
// forge
var forgeSDK = require('forge-apis');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var fs = require('fs');
var formidable = require('formidable');
var path = require('path');

var UserSession = require('../services/userSession');
var config = require('../config');
var utility = require('../utility');

var bimIssuesServicesRead = require('../services/bim.issues.services.read'); 
var bimIssuesServicesWrite = require('../services/bim.issues.services.write'); 
var projectsServices = require('../services/dm.projects.services');

var bimDatabase = require('../bim.database');
var progress = require('request-progress');



router.get('/issuebasic/getTreeNode', function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var input = {
    oAuth:userSession.getUserServerOAuth(),
    credentials:userSession.getUserServerCredentials()
  }

  if (req.query.id == '#') {
      var project_href = req.query.projectId;
      var params = project_href.split('/');
      var projectId = params[params.length - 1];
      var filter = req.query.filter;

      var issuesContainerId = bimDatabase.getIssueContainerId(projectId);
      if(issuesContainerId) 
      {
          input.containerId = issuesContainerId; 
          input.filter = filter;
          bimIssuesServicesRead.getIssues(input).then(function(result){
            res.json(result.issues); 
          }).catch(function(error){
            res.status(500).end();
          })
      } 
  } else {
    switch (req.query.type) {
      case 'quality_issues':
        getIssueContents(req.query.data.containerId, req.query.data.issueId, res);
        break;
      case 'commentscoll':
        input.containerId = req.query.data.containerId; 
        input.issueId = req.query.data.issueId; 
        bimIssuesServicesRead.getIssueComments(input).then(function(result){
          res.json(result.comments); 
        }).catch(function(error){
          res.status(500).end();
        })
         break;
      case 'attachmentscoll':
        input.containerId = req.query.data.containerId; 
        input.issueId = req.query.data.issueId; 
        
        bimIssuesServicesRead.getIssueAttachments(input).then(function(result){
          res.json(result.attachments); 
        }).catch(function(error){
          res.status(500).end();
        })        
        break;
      case 'comments':
        getOneComment(req.query.data, res);
        break;
      case 'attachments':
        //getOneAttachment(req.query.id, res);
        break;
      case 'attributescoll':
        input.containerId = req.query.data.containerId; 
        input.issueId = req.query.data.issueId; 
        bimIssuesServicesRead.getAttributes(input).then(function(result){
          res.json(result.attributes); 
        }).catch(function(error){
          res.status(500).end();
        })  
        break;
      case 'pushpin':
        getOnePushpin(req.query.data.attributes.pushpin_attributes, res);
        break;
    }
  }
}); 


function getIssueContents(containerId, issueId, res) {

  var itemsForTree = [];

  //attributes
  itemsForTree.push(utility.prepareItemForIssueTree(
    '',
    'Attributes',
    'attributescoll',
    true,
    { containerId: containerId, issueId: issueId }
  ));

  //comments collection
  itemsForTree.push(utility.prepareItemForIssueTree(
    '',
    'Comments',
    'commentscoll',
    true,
    { containerId: containerId, issueId: issueId }

  ));

  //attachments collection
  itemsForTree.push(utility.prepareItemForIssueTree(
    '',
    'Attachments',
    'attachmentscoll',
    true,
    { containerId: containerId, issueId: issueId }
  ));
  res.json(itemsForTree);

}
 

function getOneComment(commentsData, res) {

  var commentsDataForTree = [];

  commentsDataForTree.push(utility.prepareItemForIssueTree(
    '',
    'create_at: ' + commentsData.create_at,
    'commentsdata',
    false
  ));

  commentsDataForTree.push(utility.prepareItemForIssueTree(
    '',
    'create_by: ' + commentsData.created_by,
    'commentsdata',
    false
  ));

  commentsDataForTree.push(utility.prepareItemForIssueTree(
    '',
    'body: ' + commentsData.body,
    'commentsdata',
    false
  ));

  commentsDataForTree.push(utility.prepareItemForIssueTree(
    '',
    'updated_at: ' + commentsData.updated_at,
    'commentsdata',
    false
  ));

  res.json(commentsDataForTree);
}
 

function getOnePushpin(pushpinData, res) {

  var pushpinDataForTree = [];

  pushpinDataForTree.push(utility.prepareItemForIssueTree(
    '',
    'type: ' + pushpinData.type,
    'pushpindata',
    false
  ));

  var location = '(' + pushpinData.location.x + ',' + pushpinData.location.y + ',' + pushpinData.location.z + ')';
  pushpinDataForTree.push(utility.prepareItemForIssueTree(
    '',
    'location: ' + location,
    'pushpindata',
    false
  ));

  if (pushpinData.viewer_state != null &&
    pushpinData.viewer_state != undefined &&
    pushpinData.viewer_state != '') {

    var viewpoint_up = '(' + pushpinData.viewer_state.viewport.up[0] + ','
      + pushpinData.viewer_state.viewport.up[1] + ','
      + pushpinData.viewer_state.viewport.up[2] + ')';

    pushpinDataForTree.push(utility.prepareItemForIssueTree(
      '',
      'viewport up : ' + viewpoint_up,
      'pushpindata',
      false
    ));

    var viewpoint_eye = '(' + pushpinData.viewer_state.viewport.eye[0] + ','
      + pushpinData.viewer_state.viewport.eye[1] + ','
      + pushpinData.viewer_state.viewport.eye[2] + ')';

    pushpinDataForTree.push(utility.prepareItemForIssueTree(
      '',
      'viewport eye : ' + viewpoint_eye,
      'pushpindata',
      false
    ));

    var viewpoint_target = '(' + pushpinData.viewer_state.viewport.target[0] + ','
      + pushpinData.viewer_state.viewport.target[1] + ','
      + pushpinData.viewer_state.viewport.target[2] + ')';

    pushpinDataForTree.push(utility.prepareItemForIssueTree(
      '',
      'viewport target : ' + viewpoint_target,
      'pushpindata',
      false
    ));
  }

  res.json(pushpinDataForTree);
}


router.get('/issuebasic/getAttachment', function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var attachmentUrl = req.query.url;
  var attachmentName = req.query.name; 

  request.get({
    url: attachmentUrl,
    headers: config.fieldissuev1.httpHeaders(userSession.getUserServerCredentials().access_token),
    encoding: 'binary'
  },
    function (error, response, body) {

      if (error) {
        console.log(error);
        res.status(500).end();
      } else {

        var file_full_path_name = path.join(__dirname, '/../downloads/' + attachmentName);;
        fs.writeFile(file_full_path_name, body, 'binary', function (err) {
          if (err)
            res.status(500).end();
          else {
            console.log('File saved.')
            res.download(file_full_path_name);
          }
        })
      }
    }); 
});

router.get('/issuebasic/temp', function (req, res) {

  // The options argument is optional so you can omit it 
progress(request.get({
  url: 'https://developer.api.autodesk.com/oss/v2/buckets/bauma-2018/objects/BAUMA-Inventor2Revit-high.rvt',
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6Imp3dF9zeW1tZXRyaWNfa2V5In0.eyJjbGllbnRfaWQiOiJHTFJWOTZmTjROZmJhYVNPbzhOU25ONkhxOUdVaTd3NiIsImV4cCI6MTU0MjY4OTUxOSwic2NvcGUiOlsiZGF0YTpyZWFkIiwiZGF0YTp3cml0ZSIsImJ1Y2tldDpjcmVhdGUiLCJidWNrZXQ6cmVhZCIsImFjY291bnQ6cmVhZCJdLCJhdWQiOiJodHRwczovL2F1dG9kZXNrLmNvbS9hdWQvand0ZXhwNjAiLCJqdGkiOiI5YXVLblU2QVp3RDRCY0NMTE1xdkw4dkV5RTExbHRJWWQxV1pOcnBNVkhKNWJQVGpyYUhJNDJrNXJTeGtrdFlsIn0.2bXde__NN1_BnxLvZO9G8qiEl5zHUtZ-lqOuzrwM6b4' 
     
  },
  encoding: 'binary'
}), {
  // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms 
  // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms 
  // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length 
})
.on('progress', function (state) {
  // The state is an object that looks like this: 
  // { 
  //     percent: 0.5,               // Overall percent (between 0 to 1) 
  //     speed: 554732,              // The download speed in bytes/sec 
  //     size: { 
  //         total: 90044871,        // The total payload size in bytes 
  //         transferred: 27610959   // The transferred payload size in bytes 
  //     }, 
  //     time: { 
  //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals) 
  //         remaining: 81.403       // The remaining seconds to finish (3 decimals) 
  //     } 
  // } 
  console.log('progress ', state);
})
.on('error', function (err) {
  // Do something with err 
  console.log('error!')

})
.on('end', function () {
  // Do something after request finishes 
  console.log('done!')
})
.pipe(fs.createWriteStream('111.rvt')); 
  
});

router.post('/issuebasic/createIssues', jsonParser, function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var project_href = req.body.project_href;
  var params = project_href.split('/');
  var projectId = params[params.length - 1];

  var issuesContainerId = bimDatabase.getIssueContainerId(projectId); 
  if(!issuesContainerId)
    {
      res.status(500).end();
      return;
    }

  var title = req.body.title;
  var desc = req.body.desc;
  var status = req.body.status;
  var assigned_to = req.body.assigned_to;
  var assigned_to_type = req.body.assigned_to_type;
  var due_date = req.body.due_date;

  var data = {
    type: 'quality_issues',
          attributes: {
            'title': title, 'description': desc, 'status': status,
            'assigned_to': assigned_to,
            'assigned_to_type': assigned_to_type,
            'due_date': due_date,
            'ng_issue_type_id': 'd73dc282-8ff3-44cb-9db9-84e92fdfe024', //hard-coded for simple demo
            'ng_issue_subtype_id': '202d59b1-1c2b-4270-824c-d53f3c3754bc',//hard-coded for simple demo
            'root_cause_id': 'aff4b70b-54aa-4e13-92b4-49caf542bef4'//hard-coded for simple demo
     }
   } 
   input={
     credentials:userSession.getUserServerCredentials(),
     containerId:issuesContainerId,
     data:data
    }

    bimIssuesServicesWrite.createIssues(input).then(function(result){
    res.status(200).json({issueId:result.issueId})
  }).catch(function(error){
    res.status(500).end();
  })
 
});

router.post('/issuebasic/createIssuesComments', jsonParser, function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  } 

  input={
    credentials:userSession.getUserServerCredentials(),
    containerId:req.body.containerId,
    issue_id:req.body.issueId,
    body:req.body.body
    } 
    bimIssuesServicesWrite.createIssuesComments(input).then(function(result){
      res.status(200).json({})
    }).catch(function(error){
      res.status(500).end();
    }) 
}); 



router.post('/issuebasic/createIssueAttachment', jsonParser, function (req, res) {

  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }
  var project_href = req.body.project_href;
  var params = project_href.split('/');
  var projectId = params[params.length - 1]; 

  var photoFolder_href = bimDatabase.getPhotoFolderId(projectId); 
  if(!photoFolder_href)
  {
      res.status(500).end();
      return;
  } 

  var params = photoFolder_href.split('/');
  var attachment_folder_id = params[params.length - 1];
  
  var containerId = req.body.containerId;
  var issue_id = req.body.issue_id;
  var file_full_path_name = path.join(__dirname, '/../downloads/' + req.body.attachment_name);

  //the code has not taken into consideration on item version
  //so, make unique name with the file.
  var attachment_name = utility.randomValueBase64(3) + ' ' + req.body.attachment_name;  
  var input = {
    containerId: containerId,
    folderId: attachment_folder_id,
    issue_id: issue_id,
    newFileName: attachment_name,
    projectId: projectId,
    file_full_path_name: file_full_path_name,
    credentials:userSession.getUserServerCredentials(),
  };

    projectsServices.createOneItem(input).then(function(result){
      input.attachment_name = input.newFileName;
      input.objectUrn = result.newFileObjUrn;
      return bimIssuesServicesWrite.createIssueAttachment(input); 
    }).then(function(result){
      console.log('attach item to issue succeeded!');

      if (fs.exists(input.file_full_path_name))
        fs.unlink(input.file_full_path_name);
      res.json({attachment_id: result.attachment_id });

    }).catch(function (result) {
      if (fs.exists(file_full_path_name))
        fs.unlink(file_full_path_name);
      console.log(result.error);
      res.status(500).end();
    }); 

});


router.post('/issuebasic/uploadphoto', function (req, res) {

  var form = new formidable.IncomingForm();

  form.multiples = true;

  form.uploadDir = __dirname + '/../downloads';

  form.on('file', function (field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function (err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function (project, fields, files) {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);
});
 
module.exports = router;

