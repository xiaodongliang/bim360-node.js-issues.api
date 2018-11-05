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



  $(document).ready(function () { 

 
   if (getForgeToken() != '') {
      getBIMHubs(); 
   }

    $.getJSON("/api/forge/clientID", function (res) {
        $("#ClientID").val(res.ForgeClientId);
    });

    $("#provisionAccountSave").click(function () {
        $('#provisionAccountModal').modal('toggle');
     });
     $("#refreshHubs").click(function () {
      getBIMHubs(); 
    });

    $('#dashboard').click( function (e) {
     
    });

});

var haveBIM360Hub = false;

function getBIMHubs() {

  //add dropdown options 

  $('#projectview').html(
    '<div><h4 align="center" >BIM 360 Projects List  <span id="refreshHubs" class="glyphicon glyphicon-refresh" style="cursor: pointer;float:center" title="Refresh list of files"></span></h4></div><br/>'+

      '<div id="hubs_list"></div>' 
              
  );  
  //get projects list 
  jQuery.ajax({
    url: '/dm/getTreeNode',
     type: 'GET' ,
     "data":  {id: "#"},
     success: function (res) {  
      if(res!=null && res != ''){ 
        res.forEach(function (n) {
        if (n.type === 'bim360Hubs' && n.id.indexOf('b.') > 0)
            haveBIM360Hub = true;

            var projViewId = n.text.replace(/ /g,''); 
            //produce the hubs layout
            $('#hubs_list').append(
              '<div class="row" >'+
              '<h5><span class="glyphicon glyphicon-king" style="margin-right:10px;font-size: 15px;"></span>'+n.text+
             '</h5><div class="list-group" id="project-list-tab-' + projViewId +'" role="tablist">'+
             '</div></div>' 
            );  
            //dump projects list
            getProjects(n.id,projViewId); 

          });
        if (!haveBIM360Hub) {
            $("#provisionAccountModal").modal();
              haveBIM360Hub = true;
        }else{
           //dump project list

        }
      }else{

      }
     },
    error: function (res) {   
    }
  }); 

} 

function getProjects(hubId,projViewId){
 

  //get projects list 
  jQuery.ajax({
    url: '/dm/getTreeNode',
     type: 'GET' ,
     "data":  {id: hubId},
     success: function (res) {  

      if(res!=null && res != ''){ 

        var index = 0;
        res.forEach(function (n) {
        if (n.type === 'bim360projects')  
            
            //produce the project layout 
            var itemId = n.text.replace(/\s/g, '');
            $('#project-list-tab-'+projViewId).append(
               '<a class="list-group-item list-group-item-action" ' + 
               'id="project-'+ itemId  + '"' +
                ' data-toggle="list" role="tab" aria-controls="home"> <span class="glyphicon glyphicon-list-alt" style="margin-right:10px;"></span> <span></span> '+n.text+'</a>'
            ); 
             
            $('#project-' + itemId).data('bim-project-id', n.id);
            $('#project-' + itemId).click(function(){
               $(this).addClass('active').siblings().removeClass('active');
               var projectId = $(this).data('bim-project-id'); 
               $('#labelProjectHref').text(projectId); 

               if($('.nav-tabs .active').text().includes('Basic')){ 
                  prepareBIMIssuesTree(projectId);
                  document.getElementById('loader_stats').style.display = "none";  
               }
              else if ($('.nav-tabs .active').text().includes('Dashboard')){
                refreshDashboard(projectId); 
              }else if ($('.nav-tabs .active').text().includes('Integration')){
                  prepareFolderTree(projectId,'source'); 
                  prepareFolderTree(projectId,'target');  
              }
              else{
                //reserved
              }
             }); 

            index++;
          });
        
      }else{

      }
     },
    error: function (res) {   
    }
  }); 

}
 