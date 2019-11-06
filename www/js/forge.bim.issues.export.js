$(document).ready(function () { 
    
  $('#btnExportCSV').click(function(rvt){
    
    if($('#labelProjectHref').text() == ''){
      alert('please select one project!');
      return;
    }
    var projectHref = $('#labelProjectHref').text(); 
    exportCSV(projectHref); 
  });   

  $('#radioCSV_export').click(function () {
    $("#radioCSV_export").prop("checked", true); 
    $("#radioExcel_export").prop("checked", false); 

  });
  $('#radioExcel_export').click(function () {
    $("#radioExcel_export").prop("checked", true); 
    $("#radioCSV_export").prop("checked", false);   
  });

  $('#radioFieldIssue_export').click(function () {
    $("#radioFieldIssue_export").prop("checked", true); 
    $("#radioDocIssue_export").prop("checked", false); 

  });
  $('#radioDocIssue_export').click(function () {
    $("#radioDocIssue_export").prop("checked", true); 
    $("#radioFieldIssue_export").prop("checked", false);   
  }); 

}); 

function exportCSV(projectHref){ 

  jQuery.ajax({
    url: '/api/forge/issuecsv/startjob',
    contentType: 'application/json',
    type: 'GET',
    dataType: 'json',
    data:  {
      'projectHref': projectHref,
      'isDocIssue': $('#radioDocIssue_export').is(":checked"),
      'isCSV':$('#radioCSV_export').is(":checked"),
      'withComments':$('#withComments').is(":checked"),
      'withCustomFields':$('#withCustomFields').is(":checked"),
      'isOnePage':false
    },
    success: function (res) {  
        $('#loader_stats').css({ display: "block" });  
        checkExportJob(res.jobId);  
    },
    error: function (res) { 
    }
  });
} 

function checkExportJob(jobId){
  jQuery.ajax({
    url: '/api/forge/issuecsv/checkjob',
    contentType: 'application/json',
    type: 'GET',
    dataType: 'json',
    data:  {
      'jobId': jobId 
    },
    success: function (res) { 
      if(res.status == 'working'){
        setTimeout (function () { checkExportJob (jobId) ; }, 2000) ; 
      }
      else{  
           $('#loader_stats').css({ display: "none" }); 

          if(res.status == 'done')
            window.location  = '/api/forge/issuecsv/downloadCSV?jobId='+jobId; 
          else
            alert(res.status); 
      } 
     },
    error: function (res) {  
      $('#btnExportCSV').prop('disabled', false); 
      document.getElementById('loader_stats').style.display = "none";  
 
    }
  }); 
}  