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
var moment = require('moment');
var fs = require('fs'); 
var path = require('path');

var forgeSDK = require('forge-apis');
var utility = require('../utility');

function getProjects(input) {

  return new Promise(function(resolve,reject){   

  var projectsAPI = new forgeSDK.ProjectsApi();;

  projectsAPI.getHubProjects(input.hubId, {},
    input.oAuth,input.credentials)
    .then(function (response) {

      console.log('get projects succeeded!');

      var projects= [];

      response.body.data.forEach(function (project) {
        var projectType = 'projects';
        switch (project.attributes.extension.type) {
          //case 'projects:autodesk.core:Project':
          //  projectType = 'a360projects';
          //  break;
          case 'projects:autodesk.bim360:Project':
            projectType = 'bim360projects';
            break;
        }

        projects.push(utility.prepareItemForTree(
          project.links.self.href,
          project.attributes.name,
          projectType,
          true
        ));
      });

      resolve({projects:projects});   

    })
    .catch(function (error) {
      console.log('get projects failed!'); 
      reject({error:error});
    });
  });
}

function getProject(input) {

  return new Promise(function (resolve, reject) {

    var projects = new forgeSDK.ProjectsApi();

    projects.getProject(input.hubId, input.projectId,
                        input.oAuth,input.credentials)
      .then(function (response) {

        console.log('get one project succeeded!');
 
        resolve({projectInfo:response.body.data});  
      })
      .catch(function (error) {
        console.log('get one project failed!'); 
        reject({error:error});
      });
  });
}


function getFolderContents(input) {

  return new Promise(function (resolve, reject) {

    var folders = new forgeSDK.FoldersApi();
    folders.getFolderContents(input.projectId,
      input.folderId, null,
      input.oAuth,
      input.credentials)
      .then(function (response) {

        var contents = [];
        response.body.data.forEach(function (item) {
          contents.push(utility.prepareItemForTree(
            item.links.self.href,
            item.attributes.displayName == null ? 
                item.attributes.name : item.attributes.displayName,
            item.type,
            true
          ))
        });
        
        resolve({contents:contents});
      })
      .catch(function (error) {
        reject({ error: error });
      });
  });
} 

function getVersions(input) {

  return new Promise(function (resolve, reject) {

  var items = new forgeSDK.ItemsApi();
  items.getItemVersions(input.projectId, input.itemId, {}, 
    input.oAuth,input.credentials)
    .then(function (response) {
      var versions = [];

      response.body.data.forEach(function (version) {
        var lastModifiedTime = moment(version.attributes.lastModifiedTime);
        var days = moment().diff(lastModifiedTime, 'days');
        var fileType = version.attributes.fileType;
        var dateFormated = (versions.body.data.length > 1 || days > 7 ? lastModifiedTime.format('MMM D, YYYY, h:mm a') : lastModifiedTime.fromNow());
        var designId = (version.relationships != null && version.relationships.derivatives != null ? version.relationships.derivatives.data.id : null);
        var fileName = version.attributes.fileName;
        var versionst = version.id.match(/^(.*)\?version=(\d+)$/)[2];

        versions.push(prepareItemForTree(
          designId,
          decodeURI('v' + versionst + ': ' + dateFormated + ' by ' +
           version.attributes.lastModifiedUserName),
          'versions',
          false,
          fileType,
          fileName
        ));
      });
      resolve({versions:versions});
    })
    .catch(function (error) {
      reject({ error: error });
    })
  })
} 

function createOneItem(input){
  return new Promise(function (resolve, reject) {

    createStorage(input).then(function(result){
        console.log('create storage for file succeeded!'); 
        input.newFileObjUrn = result.newFileObjUrn;
        return uploadFile(input);
    }).then(function(result){
      console.log('upload file  succeeded!'); 
       return postItem(input);
    }).then(function(result){
      console.log('post item  succeeded!');  
      resolve({newFileObjUrn:result.newFileObjUrn});
    }).catch(function(error){
      reject({error:error});
    });
  });

}


function createStorage(input) { 

  return new Promise(function (resolve, reject) {

    var body = {
      "data": {
        "type": "objects",
        "attributes": { "name": input.newFileName },
        "relationships": {
          "target": {
            "data": {
              "type": "folders",
              "id": input.folderId
            }
          }
        }
      }
    };

    var projects = new forgeSDK.ProjectsApi();

    projects.postStorage(input.projectId, body,
      input.oAuth,input.credentials)
      .then(function (storageRes) { 
          resolve({newFileObjUrn:storageRes.body.data.id});
      })
      .catch(function (error) {  
        reject({ error: error });
      });
  });
}

function uploadFile(input) {

  return new Promise(function (resolve, reject) {

    var newFileObjUrn = input.newFileObjUrn;
    var params = newFileObjUrn.split('/');
    var objectId = params[params.length - 1];

    params = params[params.length - 2].split(':');
    var bucketKey = params[params.length - 1];

    fs.readFile(input.file_full_path_name, function (err, filecontent) {

      var objects = new forgeSDK.ObjectsApi();
      objects.uploadObject(bucketKey, objectId,
        filecontent.length, filecontent, {},
        input.oAuth,input.credentials)
        .then(function (uploadObjRes) {
          resolve({newFileObjUrn:input.newFileObjUrn});
        }).catch(function (error) {
           reject({ error: error });
        });
    });
  });
} 

function postItem(input) {

  return new Promise(function (resolve, reject) {

     var params = input.newFileObjUrn.split('/');
 
    params = params[params.length - 2].split(':');
 
    var body = {
      "data": {
        "type": "items",
        "attributes": {
          "displayName": input.newFileName,
          "extension": {
            "type": "items:autodesk.bim360:File",
            "version": "1.0"
          }
        },
        "relationships": {
          "tip": {
            "data": {
              "type": "versions",
              "id": "1"
            }
          },
          "parent": {
            "data": {
              "type": "folders",
              "id": input.folderId
            }
          }
        }
      },
      "included": [
        {
          "type": "versions",
          "id": "1",
          "attributes": {
            "name": input.newFileName,
            "extension": {
              "type": "versions:autodesk.bim360:File",
              "version": "1.0"
            }
          },
          "relationships": {
            "storage": {
              "data": {
                "type": "objects",
                "id": input.newFileObjUrn
              }
            }
          }
        }
      ]
    }

    var itemsApi = new forgeSDK.ItemsApi();
    itemsApi.postItem(input.projectId, body,
      input.oAuth,input.credentials)
      .then(function (postItemRes) {
         resolve({newFileObjUrn:input.newFileObjUrn});
      }).catch(function (error) {
         reject({ error: error });
      }); 
    }); 
}

function getItemStorage(input){
  return new Promise(function(resolve,reject){ 
      var items = new forgeSDK.ItemsApi();
      items.getItem(input.projectId, 
                    input.itemId, 
                    input.oAuth, 
                    input.credentials)
      .then(function (result) {
        resolve({itemStg:result.body.included[0].relationships.storage.meta.link.href});
      }).catch(function (error) {
         reject({error:error});
     }); 
  }); 
}
 

module.exports = { 
  getProjects:getProjects,
  getProject:getProject,
  getFolderContents:getFolderContents,
  getVersions:getVersions,
  createOneItem:createOneItem,
  getItemStorage:getItemStorage,
  createStorage:createStorage,
  postItem:postItem
}


 


