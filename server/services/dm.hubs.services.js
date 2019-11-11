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
 
var forgeSDK = require('forge-apis');
var utility = require('../utility');
var config = require('../config'); 
require('es6-promise').polyfill();
require('isomorphic-fetch');

function getHubs(input){

  return new Promise(function(resolve,reject){  

    var hubsAPI = new forgeSDK.HubsApi(); 
    hubsAPI.getHubs({}, input.oAuth,input.credentials)
        .then((response)=> { 
          console.log('get hubs succeeded!');

            var hubs = [];
            response.body.data.forEach(function (hub) {
              var hubType;  
              switch (hub.attributes.extension.type) {
                case "hubs:autodesk.core:Hub":
                  hubType = "hubs";
                  break;
                case "hubs:autodesk.a360:PersonalHub":
                  hubType = "personalHub";
                  break;
                case "hubs:autodesk.bim360:Account":
                  hubType = "bim360Hubs";
                  break;
              }
              if (hubType == "bim360Hubs") {
                hubs.push(utility.prepareItemForTree(
                  hub.links.self.href,
                  hub.attributes.name,
                  hubType,
                  true
                ));
              }
            });  

            resolve({hubs:hubs}); 
        })
        .catch(function (error) {
          console.log('get hubs failed!'); 
          reject({error:error});
        });
  })
}

function getUserProfile(input){

  return new Promise(function(resolve,reject){  

    request({
      url: config.hqv1.userprofile_useratme,
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + input.credentials.access_token
      }
    }, function (error, response, body) {
  
      if (error != null) {
        console.log('get user profile failed!');  
        reject({error:error});

       }else if(body.errors != null){
        reject({error:body.errors});
       }
       else{ 
        console.log('get user profile succeeded!');  
        var json = JSON.parse(body);
        var profile = {
          'name': json.firstName + ' ' + json.lastName,
          'picture': json.profileImages.sizeX20
        }
        resolve({profile:profile}); 
      }
    })
  })
} 

function getHQUsersList(input,allUsers,pageOffset){

      var headers = {
        Authorization: 'Bearer '+ input.access_token,
        'Content-Type': 'application/json' 
      }

      var url = 
          'https://developer.api.autodesk.com/hq/v1/accounts/' 
          + input.accountId 
          + '/users?offset=' + pageOffset
      
      return fetch(url,{
            method: 'GET',
            headers:headers
          }).then(response => response.json()).then(data => {
              if(data.length >0 )
                {
                  allUsers = allUsers.concat(data); 
                    return getHQUsersList(input,allUsers,allUsers.length); 
                }
              else 
                  return allUsers;  
          }); 
}  


function getProjectCompanies(input){

  return new Promise(function(resolve,reject){  

    var accountId = input.hubId.replace('b.','')
    var projectId = input.projectId.replace('b.','')

    request({
      url: config.hqv1.getCompanies(accountId,projectId),
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + input.adminToken.credentials.access_token
      }
    }, function (error, response, body) {
  
      if (error != null) {
        console.log('get companies failed!');  
        reject({error:error});

       }else if(body.errors != null){
        reject({error:body.errors});
       }
       else{ 
        console.log('get companies succeeded!');  
        var json = JSON.parse(body); 
        resolve({companies:json}); 
      }
    })
  })
} 


function getProjectRoles(input){

  return new Promise(function(resolve,reject){  

    var accountId = input.hubId.replace('b.','')
    var projectId = input.projectId.replace('b.','')

    request({
      url: config.hqv1.getRoles(accountId,projectId),
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + input.credentials.access_token
      }
    }, function (error, response, body) {
  
      if (error != null) {
        console.log('get roles failed!');  
        reject({error:error});

       }else if(body.errors != null){
        reject({error:body.errors});
       }
       else{ 
        console.log('get roles succeeded!');  
        var json = JSON.parse(body); 
        resolve({roles:json}); 
      }
    })
  })
} 
  


module.exports = { 
  getHubs:getHubs,
  getUserProfile:getUserProfile,
  getHQUsersList:getHQUsersList,
  getProjectCompanies:getProjectCompanies,
  getProjectRoles:getProjectRoles
}


 


