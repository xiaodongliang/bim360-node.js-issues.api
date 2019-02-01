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

//web services of design automation 

'use strict';   
 
var request = require('request'); 
var fs = require('fs');  
var path = require('path');  

var config = require('../config');  

const _activityIds= { 
  v3_dwg_exportpdf:config.dav3.dwgToPDFActName
} 

function createDAWorkItemV3(input){
  return new Promise(function(resolve,reject){ 
    var design_auto_params = { 
        activityId: _activityIds[input.actString],
        arguments: {
            HostDwg: {
                url: input.sourceItemStg,
                Headers: {
                    Authorization: 'Bearer ' + input.credentials.access_token
                },
            },
            Result: {
                verb: 'put',
                url: input.outputItemStg,

                Headers: {
                  Authorization: 'Bearer ' + input.credentials.access_token
                }
            } 
        }
    };  

    console.log(JSON.stringify(design_auto_params));
    console.log(input.credentials.access_token);
    var headers = {
      Authorization: 'Bearer ' + input.credentials.access_token,
      'Content-Type': 'application/json' 
    }
    console.log( _activityIds[input.actString] + ' ' + config.dav3.createWorkItem());

    request.post({
      url: config.dav3.createWorkItem(),
      headers: headers,
      body: design_auto_params,
      json: true
    },  function (error, response, body) {

      console.log('createDAWorkItemV3 ' + response.statusCode + error);

      if(error || response.statusCode != 200){
        reject({error:error,reqId:input.reqId});
      }else{ 
        input.workitemId = body.id; 
        checkWorkItemV3(input,
          function() { 
            console.log('working workitem');

               resolve({status:'done'}); 
          },
          function (workitemId,failure) {
             console.log('One migration failed! ');
             if (failure == 'Reached check limit') {  
              console.log('work item failed ' + input.displayName);
              reject({status:'exception'});
             }
             else
              { 
                console.log('failed workitem');

                var logFileName =  workitemId +'.log'; 

                resolve({status:'failed',
                         logFileName:logFileName,
                         logFileHref:failure,
                         workitemId:workitemId})
               
              }
          }
        );  
      } 
    }); 

  }); 
} 

function checkItemInterval(input,success, failure){ 

  var url = config.dav3.getWorkItemStatus(input.workitemId);
  
  request.get({
    url: url,
    headers: 
      {
         Authorization: 'Bearer ' + input.credentials.access_token,
      }
  },
  function (error, response, body) {
    console.log('checkWorkItemV3 ' + response.statusCode  + ' ' + body );

    if (error) throw error;

    if (response.statusCode == 200) {
      var workItem2 = JSON.parse(body);  

      console.log('   Checked Status: ' + workItem2.status);

      switch (workItem2.status) {
         case 'pending':
          if (input.checkedTime < 200) {
            input.checkedTime++; 
          } else {
            console.log(' Reached check limit.'); 
            clearInterval(input.checkInterval);
            failure(input.workitemId,'Reached check limit');
          }
          break;
        case 'failedInstructions':
           clearInterval(input.checkInterval); 
          failure(input.workitemId,workItem2.reportUrl);
        break;
        case 'success':
          clearInterval(input.checkInterval); 
          success();
          break;
        default:
          clearInterval(input.checkInterval); 
          failure(input.workitemId,workItem2.reportUrl);
      }
    }
  });
}
function checkWorkItemV3(input, success, failure) {

  console.log(' Checking Work Item Status ' + input.workitemId);

  input.checkedTime = 0; 
  input.checkInterval = setInterval( 
    function() { 
      checkItemInterval(input,success, failure); 
  }, 4000 );


} 

function downloadReport(logFileName,cloudHref) {
  
  return new Promise(function(resolve,reject){  
    console.log(' Downloading and Displaying Report'); 
    var r = request.get(cloudHref).pipe(fs.createWriteStream(__dirname+'/../downloads/'+logFileName));
    r.on('finish',
      function() {
        console.log('   Report File: ' + logFileName);
        resolve({});
      }
    );
  });
} 

module.exports = {
  createDAWorkItemV3:createDAWorkItemV3,
  downloadReport,downloadReport
}; 
