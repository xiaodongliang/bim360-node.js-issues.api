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

var express = require('express');
var request = require('request'); 
var router = express.Router();   
   
//recursively get issues until all pages are dumped
function refreshIssue(input,allIssues,pageOffset){ 
  var headers = {
    Authorization: 'Bearer '
    + input.credentials.access_token,
    'Content-Type': 'application/vnd.api+json' 
  }

  var url =  'https://developer.api.autodesk.com/issues/v1/containers/' 
              + input.containerId 
              + '/quality-issues?page[limit]=20&page[offset]='+ pageOffset  
  
  return fetch(url,{
        method: 'GET',
        headers:headers
      }).then(response => response.json()).then(data => {
          if(data.data.length >0 )
             {
              allIssues = allIssues.concat(data.data); 
                return refreshIssue(input,allIssues,allIssues.length); 
             }
          else 
              return allIssues;  
      }); 
} 

var allIssues = [];
//set start record index = 0
refreshIssue(input,allIssues,0)
 

module.exports = {
  router:router,
  refreshIssue:refreshIssue
}; 