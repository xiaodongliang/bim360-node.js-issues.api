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
 

function prepareBIMIssuesTree(projetId) {
  var thisIssueTree = $('#issuetree').jstree(true); 
  if(thisIssueTree) { thisIssueTree.destroy(); }

  $('#issuetree').jstree({
    'core': {
      'themes': {"icons": true},
      'data': {
        "url": '/issuebasic/getTreeNode',
        "dataType": "json",
        "multiple": false,
        "cache": false,
        "data": function (node) {
          $('#issuetree').jstree(true).toggle_node(node);
          if(node.id == '#')
          {
            var date_input = new Date($("#issuedate").val());
            var one_day_late = date_input;
            due_date = date_input.getFullYear() 
                            +'-' + (date_input.getMonth() +1)
                            + '-' +date_input.getDate();

            
              one_day_late.setDate(date_input.getDate() +  1);
              one_day_late = one_day_late.getFullYear() 
                +'-' + (one_day_late.getMonth() +1)
                + '-' +one_day_late.getDate();
            return {"id": node.id,
                    "projectId":projetId,
                    "filter":{one_day_late:one_day_late,
                              due_date:due_date}}; 
          }
          else
             return {"id": node.id,"type":node.type,"data":node.data};  

        },
        "success": function (node) {
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
      'comments': {
        'icon': 'glyphicon glyphicon-comment'
      },
      'attachments': {
        'icon': 'glyphicon glyphicon-save-file'
      },
      'attributes': {
        'icon': 'glyphicon glyphicon-option-horizontal'
      },
      'quality_issues': {
        'icon': 'glyphicon glyphicon-check'
      },
      'commentscoll': {
        'icon': 'glyphicon glyphicon-align-justify'
      },
      'attachmentscoll': {
        'icon': 'glyphicon glyphicon-download'
      },
      'attributescoll': {
        'icon': 'glyphicon glyphicon-list'
      },
      'commentsdata': {
        'icon': 'glyphicon glyphicon-option-horizontal'
      },
      'pushpin': {
        'icon': 'glyphicon glyphicon-eye-open'
      },
      'pushpindata': {
        'icon': 'glyphicon glyphicon-option-horizontal'
      }
    },
    "plugins": 
      ["types", "state", "sort"]
  }).bind("activate_node.jstree", function (evt, data) {

    $('#labelIssueHref').text('');  
    $('#labelPushpinParam').text(''); 

    if(data != null && data.node != null && data.node.type == 'issues'){
      //issue
      $('#labelIssueHref').text(data.node.id);  
    } 
    //pushpin
    else if (data != null && data.node != null && data.node.type == 'pushpin') {  
      
      var nodeData = data.node.data;

      var pushpin_svg = {
       object_id:nodeData.attributes.pushpin_attributes.object_id,
       location:nodeData.attributes.pushpin_attributes.location,
       viewerState:nodeData.attributes.pushpin_attributes.viewer_state,
       title:  nodeData.attributes.title,
       id:nodeData.id,
       type:nodeData.type,
       status:nodeData.attributes.status
      } 
      $('#labelPushpinParam').text(JSON.stringify(pushpin_svg)); 

      launchViewer(nodeData.attributes.pushpin_attributes.viewer_state.seedURN); 
   } 
   else if (data != null && data.node != null && data.node.type == 'attachments') {  
      //attachment 
      window.location  = '/issuebasic/getAttachment?url='+data.node.id +'&name='+data.node.text;
    }
    else{

    }  
  });
}
 

function createNewIssue(){

  if($('#labelProjectHref').text() == ''){
    alert('please select one project!');
    return;
  }

  if($('#newIssueTitle').val() == ''){
    alert('please input issue title!');
    return;
  }

  var date_input = new Date($("#newIssueDueDate").val()); 
  var due_date = date_input.getFullYear() 
                  +'-' + (date_input.getMonth() +1)
                  + '-' +date_input.getDate();
  
 
  jQuery.ajax({
    url: '/issuebasic/createIssues',
    contentType: 'application/json',
    type: 'POST',
    dataType: 'json',
    data: JSON.stringify({
      'title': $('#newIssueTitle').val(),
      'desc': 'a test to create issue from app',
      'status': 'open', 
      'assigned_to': '7462015',
      "assigned_to_type": "role",
      "due_date":due_date,
      "project_href": $('#labelProjectHref').text()
    }),
    success: function (res) { 
      $('#issuetree').jstree(true).refresh();  
    },
    error: function (res) { 
      $('#issuetree').jstree(true).refresh();
    }
  });  
}

function createNewComments(){

  if($('#issuetree').jstree("get_selected", true)== null || 
    $('#issuetree').jstree("get_selected", true).length== 0){
    alert('please select one issue!');
    return;
  } 
  if($('#newCommentBody').val() == ''){
    alert('please input comment body!');
    return;
  }

  var issue_href = $('#issuetree').jstree("get_selected", true)[0].id;
  var href = decodeURIComponent(issue_href);
  var params = href.split('/'); 
  var containerId = params[params.length - 3]; 

  var issueId = params[params.length - 1]; 

  jQuery.ajax({
    url: '/issuebasic/createIssuesComments',
    contentType: 'application/json',
    type: 'POST',
    dataType: 'json',
    data: JSON.stringify({
      'issueId': issueId,
      'body': $('#newCommentBody').val(),
      "containerId": containerId  
    }),
    success: function (res) { 
      $('#issuetree').jstree(true).refresh();  
    },
    error: function (res) { 
      alert('create comments failed!');
      $('#issuetree').jstree(true).refresh(); 
    }
  });  
}

function attachLocalFile2Issue(){

  if($('#issuetree').jstree("get_selected", true)== null || 
    $('#issuetree').jstree("get_selected", true).length== 0){
    alert('please select one issue!');
    return;
  } 
   

  var attachment_name = $('#photoname').val();
  if(attachment_name == undefined || 
    attachment_name == ''){
    alert('please select a photo!');
    return;
  } 

  var issue_href = $('#issuetree').jstree("get_selected", true)[0].id;
  var href = decodeURIComponent(issue_href);
  var params = href.split('/'); 
  var containerId = params[params.length - 3]; 

  var issueId = params[params.length - 1]; 
   

  jQuery.ajax({
    url: '/issuebasic/createIssueAttachment',
    contentType: 'application/json',
    type: 'POST',
    dataType: 'json',
    data: JSON.stringify({
      'issue_id': issueId, 
      'containerId':containerId,
      'attachment_name':attachment_name,
      "project_href": $('#labelProjectHref').text() 
    }),
    success: function (res) { 
      $('#issuetree').jstree(true).refresh();   
    },
    error: function (res) {
      alert('attach local file to issue failed!');
      $('#issuetree').jstree(true).refresh(); 
    }
  });  
}

function selectLocalFile(evt){
  var tgt = evt.target || window.event.srcElement,
  files = tgt.files;

  // FileReader support
  if (FileReader && files && files.length) {
      var fr = new FileReader();
      fr.onload = function () { 
          //display the image in the image box
          //document.getElementById('outImage').src = fr.result; 
      }
      fr.readAsDataURL(files[0]);  

      //temperorily diable attach image button until the 
      //image is uploaded to server.
      $('#btnAddIssueAttachment').prop('disabled', true);

      uploadPhoto(files[0]); 
      $('#photoname').val(files[0].name);  
  }
  else {
      // Not supported
      alert('not supported!');
  }
}

function uploadPhoto(file){ 

  //upload file to storage firstly
  var formData = new FormData();
  formData.append('uploads[]', file, file.name);
  

  $.ajax({
    url: '/issuebasic/uploadphoto',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function(data){
        console.log('upload successful!\n' + data);  
        //now we can attach image  
        $('#btnAddIssueAttachment').prop('disabled', false); 
    },
    xhr: function() {
      // create an XMLHttpRequest
      var xhr = new XMLHttpRequest(); 
      // listen to the 'progress' event
      xhr.upload.addEventListener('progress', function(evt) {

        if (evt.lengthComputable) {  
        }

      }, false); 
      return xhr;
    }
  }); 
} 

 

$(document).ready(function () {

  $('#issuedate').datepicker('setDate',new Date());
  $('#issuedate').datepicker({autoclose: true}); 

  $('#issuedate').change(function () {
    var thisIssueTree = $('#issuetree').jstree(true); 
    if(thisIssueTree)
      thisIssueTree.refresh();  
  });
  $('#btnCreateIssue').click(function(rvt){ 
    createNewIssue(); 
  }); 
  $('#btnAddIssueComment').click(function(rvt){ 
    createNewComments();
  }); 
   
  $('#btnAddIssueAttachment').click(function(rvt){  
    attachLocalFile2Issue();
  })

  $('#selectlocalphoto').on('change', function(evt){
    selectLocalFile(evt);
  }) 
  
});

