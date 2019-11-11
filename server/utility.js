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
var crypto = require('crypto');
var fs = require('fs'); 
var path = require('path');

var bimDatabase = require('./bim.database');
 

var dir = __dirname + '/downloads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
var dir = __dirname + '/status';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
module.exports = {

   statusPath: __dirname + '/status/', 

   storeStatus:function(jobId,status){
     fs.writeFileSync(this.statusPath + jobId,status);
   },

   readStatus:function(jobId){ 
    if(fs.existsSync(this.statusPath + jobId)) {
       var stats = fs.readFileSync(this.statusPath + jobId,"utf8"); 
       return stats; 
    }
    else 
       return null; 
   },

   randomValueBase64: function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
      .toString('base64')   // convert to base64 format
      .slice(0, len)        // return required number of characters
      .replace(/\+/g, '0')  // replace '+' with '0'
      .replace(/\//g, '0'); // replace '/' with '0'
  }, 

  checkAssignTo:function(hubId,containerId,
                         assigned_to_type,
                         assigned_to){ 
    switch(assigned_to_type){
      case 'user':
        return this.findUserName(hubId,assigned_to)
         break;
      case 'role':  
        return this.findRoleById(containerId,assigned_to)
        break;
      case 'company':
        return this.findCompanyById(containerId,assigned_to)
        break;
    } 
  },
  findUserName:function(hubId,userID){
     
    var hubUsers = bimDatabase.getHubUsers(hubId);
    if(hubUsers==null)
       return '<not set>';

     var founduser = hubUsers.filter(function(item){ return item.uid === userID; })
    if(founduser && founduser.length && founduser.length > 0)
    return founduser[0].name;
    else
    return '<not set>'  
  },
  findUserCompany:function(hubId,assigned_to,assigned_to_type){
  
    if(assigned_to_type == 'role' || assigned_to_type == 'company')
      return '<role/company>'  

    var hubUsers = bimDatabase.getHubUsers(hubId);
    if(hubUsers==null)
        return '<not set>';

    var founduser = hubUsers.filter(function(item){return item.uid === assigned_to;})
    if(founduser && founduser.length && founduser.length > 0){
          if(founduser[0].company_name!='')
             return founduser[0].company_name;
          else if(founduser[0].company.name!='')
             return founduser[0].name;
          else
              return '<not set>'  
      } 
       else
          return '<not set>'   
 
  },
  findIssueType:function(containerId,id) {
    var fieldIssueTypes = bimDatabase.getIssueTypesByContainer(containerId);

    if(fieldIssueTypes){
        var foundtype = fieldIssueTypes.filter(function(item){ return item.id === id; })
        if(foundtype && foundtype.length && foundtype.length > 0)
          return foundtype[0].title;
        else
          return '<not set>' 
    }
    else
      return '<not set>' 
  },

  findSubIssueType:function(containerId,id) {
    var fieldIssueTypes = bimDatabase.getIssueTypesByContainer(containerId); 
    var subtypeStr = '<not set>' 

    if(fieldIssueTypes){  
        for(var index in fieldIssueTypes){
           var oneTypeColl = fieldIssueTypes[index]
           var foundtype = oneTypeColl.subtypes.filter(function(item){ return item.id === id; })
           if(foundtype && foundtype.length && foundtype.length > 0){
              subtypeStr =  foundtype[0].title
              break
           }
        }  
    }  
    return subtypeStr
  },
  findCompanyById:function(containerId,id) {
    var companies = bimDatabase.getCompaniesByContainer(containerId); 
    if(companies){
      var foundtype = companies.filter(function(item){ return item.id === id; })
      if(foundtype && foundtype.length && foundtype.length > 0)
        return foundtype[0].name;
      else
        return '<not set>' 
    }
    else
     return '<not set>' 
   },
   findRoleById:function(containerId,member_group_id) {
    var roles = bimDatabase.getRolesByContainer(containerId); 
    if(roles){
      var foundtype = roles.filter(function(item){ return item.member_group_id === member_group_id; })
      if(foundtype && foundtype.length && foundtype.length > 0)
        return foundtype[0].name;
      else
        return '<not set>' 
    }
    else
     return '<not set>' 
   }, 
   prepareItemForTree:function(_id, _text, _type, _children, _fileType, _fileName) {
    return {
      id: _id,
      text: _text,
      type: _type,
      children: _children,
      fileType: _fileType,
      fileName: _fileName
    };
  },
  prepareItemForIssueTree:function( _id, _text, _type, _children,_data) {
    return { id:_id, 
      text: _text, 
      type: _type,
      children: _children,
      data:_data};
  }

};