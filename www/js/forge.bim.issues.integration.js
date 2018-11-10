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

function checkJobStat(jobId){
  jQuery.ajax({
    url: '/integration/checkjob',
    contentType: 'application/json',
    type: 'GET',
    dataType: 'json',
    data:  {
      'jobId': jobId 
    },
    success: function (res) { 
      //console.log(res.blob);

      var statusJson = JSON.parse(res.status);
      if(statusJson.status.includes('calculating')){
        setTimeout (function () { checkJobStat (jobId) ; }, 200) ; 
        $(".progress-bar").css({"width": "0%"});
        $('.progress-bar').html('calculating...');  
      }
      else if(statusJson.status.includes('failed')){
        $(".progress-bar").css({"width": "0%"});
        $('.progress-bar').html('failed!');  
      }
      else if(statusJson.status.includes('exporting')){
        var donePercen = (statusJson.migrated.length + 
                          statusJson.failed.length + 
                          statusJson.exception.length)/statusJson.allFiles;

        for(var i in statusJson.migrated){
          $('#sourceFoldersTree' + ' li[id="'+ statusJson.migrated[i] + '"] a').css("color","green"); 
        }
        for(var i in statusJson.failed){
          $('#sourceFoldersTree' + ' li[id="'+ statusJson.failed[i] + '"] a').css("color","red"); 
        }
        for(var i in statusJson.exception){
          $('#sourceFoldersTree' + ' li[id="'+ statusJson.exception[i] + '"] a').css("color","blue"); 
        } 

        $('#targetFoldersTree').jstree(true).refresh_node($('#targetFoldersTree').jstree("get_selected", true)[0]);
        if(donePercen<1){
          setTimeout (function () { checkJobStat (jobId) ; }, 200) ;  
          $(".progress-bar").css({"width": donePercen*100+"%"});
        }else{
          $(".progress-bar").css({"width": "100%"}); 
          $('#integration').prop('disabled', false);
          statusJson.status = 'done';
        } 

        $('.progress-bar').html(statusJson.status + 
          ' [all files] ' + statusJson.allFiles + 
          ' [exported] ' + statusJson.migrated.length +
          ' [failed] ' + statusJson.failed.length + 
          ' [exception] ' + statusJson.exception.length);    
      }
      else{
        $(".progress-bar").css({"width": "0%"});
        $('.progress-bar').html('done');  
        $('#integration').prop('disabled', false); 
      }  
    },
    error: function (res) { 
      $('#integration').prop('disabled', false); 
     }
  }); 
}

function prepareFolderTree(projectId,whichFolder) {

  $('#'+whichFolder +'FoldersTree').jstree({
    'core': {
      'themes': {"icons": true},
      'data': {
        "url": '/dm/getTreeNode',
        "dataType": "json",
        "multiple": false,
        "cache": false,
        "data": function (node) {
          $('#'+whichFolder +'FoldersTree').jstree(true).toggle_node(node);
          return { "id": node.id === "#" ? projectId : node.id };
        },
        "success": function (nodes) {
         
        }        
      }
    },
    'types': {
      'default': {
        'icon': 'glyphicon glyphicon-question-sign'
      },
      '#': {
        'icon': 'glyphicon glyphicon-user'
      },
      'hubs': {
        'icon': '/img/a360hub.png'
      },
      'personalHub': {
        'icon': '/img/a360hub.png'
      },
      'bim360Hubs': {
        'icon': '/img/bim360hub.png'
      },
      'bim360projects': {
        'icon': '/img/bim360project.png'
      },
      'a360projects': {
        'icon': '/img/a360project.png'
      },
      'items': {
        'icon': 'glyphicon glyphicon-file'
      },
      'folders': {
        'icon': 'glyphicon glyphicon-folder-open'
      },
      'versions': {
        'icon': 'glyphicon glyphicon-time'
      }
    },
    "plugins": 
      ["types", "state", "sort"]
  }).bind("activate_node.jstree", function (evt, data) {
    if (data != null && data.node != null && data.node.type == 'folders') {
      var path = data.instance.get_path(data.node,'/');
      console.log('Selected: ' + path); 
      $('#'+whichFolder +'SelectedFolderLabel').text(
        JSON.stringify({
          id:data.node.id,
          text:data.node.text
          }) 
        ); 

    }else{

    } 
  }); 

  $('#'+whichFolder +'FoldersTree').jstree(true).refresh();

}


function buildWebhook(input){
   
  

  return new Promise(function (resolve, reject) {
    var params = $('#targetFoldersTree').jstree("get_selected", true)[0].id.split('/');
    var targetFolderId = params[params.length - 1];

    jQuery.ajax({
      url: '/webhook/buildWebhook',
      contentType: 'application/json',
      type: 'GET',
      dataType: 'json',
      data:  {
         folderId:targetFolderId
       },
      success: function (res) {  
        resolve({}) 
      },
      error: function (error) { 
        reject({error:error})
      }
    });
  });  
}

function startJob(){

  return new Promise(function (resolve, reject) {

  var actString = 'v2_dwg_exportpdf' ; 

      var params = $('#sourceFoldersTree').jstree("get_selected", true)[0].id.split('/');
      var sourceFolderId = params[params.length - 1];
      params = $('#targetFoldersTree').jstree("get_selected", true)[0].id.split('/');
      var targetFolderId = params[params.length - 1];


      jQuery.ajax({
        url: '/integration/startjob',
        contentType: 'application/json',
        type: 'GET',
        dataType: 'json',
        data:  {
          'projectHref': $('#labelProjectHref').text(),
          'sourceFolderId':sourceFolderId,
          'targetFolderId':targetFolderId,
          'actString':actString
        },
        success: function (res) {  
          $('#integration').prop('disabled', true); 
          resolve({jobId:res.jobId});
        },
        error: function (error) { 
          reject({error:error})
        }
      });
    });  
}

$(document).ready(function () {   

    //batch job button click
    $('#btnBatchJob').click(function(rvt){ 

      if(!$('#sourceFoldersTree').jstree("get_selected", true)){
        alert('please select one source folder!');
        return;
      } 

      if(!$('#targetFoldersTree').jstree("get_selected", true)){
        alert('please select one target folder!');
        return;
      }

      buildWebhook().then(function(result){
        return startJob(); 
      }).then(function(result){
        checkJobStat(result.jobId); 
      }).catch(function(result){ 
      }); 
    }); 

    $("#refreshSourceFolder").click(function () {
      $('#sourceFoldersTree').jstree(true).refresh();
    });

    $("#refreshTargetFolder").click(function () {
      $('#targetFoldersTree').jstree(true).refresh();
    }); 
    
    

}); 


