//have to define global handlers of chart、、becausecontext.clearRectdoesnotclear你thelastgraphics
 
//sort the nodes of the timeliner according to the sequence of time.
var overallStatusPie = null; 
var issueByCompanyBar = null;
var issueByRootCauseBar = null;
var issueByWeekDueBar = null;

 function sortOnKeys(dict) {

  var sorted = [];
  for (var key in dict) {
      sorted[sorted.length] = key;
  }
  sorted.sort();

  var tempDict = {};
  for (var i = 0; i < sorted.length; i++) {
      tempDict[sorted[i]] = dict[sorted[i]];
  }

  return tempDict;
}

var Months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function random_rgba() {
  var o = Math.round, r = Math.random, s = 255;
  return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + 0.5 + ')';
}

function refreshIssueOverview(overview){

  var labels=[],dataTotals=[];colors=[];
  for(var status in overview){  
    labels.push(status);
    dataTotals.push(overview[status]);
    colors.push(random_rgba())
  }

   var chartData = {
    datasets: [{
        data: dataTotals,
        backgroundColor: colors
    }],
    labels: labels
  };

  var config = {
    type: 'pie', 
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,

      title: {
        display: true,
        text: 'Overall Status'
      },
      tooltips: {
        mode: 'index',
        intersect: true
      },
      legend: {
        display: true 
      },
      plugins: {
        datalabels: {
           display: true,
           align: 'center',
           anchor: 'center'
        }
     }
    }
  };


  var canvas = document.getElementById('issueOverview');
  var ctx = canvas.getContext('2d');
 
  overallStatusPie = new Chart(ctx, config);
  overallStatusPie.update();  

}

function refreshModelvsProjectView(modelvsproj){

  var config = {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [
          modelvsproj.model,
          modelvsproj.notmodel 
        ],
        backgroundColor: [
          window.chartColors.yellow,
          window.chartColors.green 
        ],
        label: 'Dataset 1'
      }],
      labels: [
        'Model Issue',
        'Project Issue' 
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      title: {
        display: true,
        text: 'Model Issue vs Project Issue'
      },
      legend: {
        display: true,
        position:'bottom'
      } 
     } 
  };


  var canvas = document.getElementById('issueModelvsProj');
  var ctx = canvas.getContext('2d');
 
  issueByRootCauseBar = new Chart(ctx, config);
  issueByRootCauseBar.update();  

}

function refreshRootcause(rootcause){ 

  var labels=[],dataTotals=[];colors=[];
  for(var cause in rootcause){  
    labels.push(cause);
    dataTotals.push(rootcause[cause]);
    colors.push(random_rgba())
  }

   var chartData = {
    datasets: [{
        data: dataTotals,
        backgroundColor: colors
    }],
    labels: labels
  };

  var config = {
    type: 'doughnut', 
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,

      title: {
        display: true,
        text: 'Root Cause'
      },
      tooltips: {
        mode: 'index',
        intersect: true
      },
      legend: {
        display: true 
      },
      plugins: {
        datalabels: {
           display: true,
           align: 'center',
           anchor: 'center'
        }
     }
    }
  };


  

  var canvas = document.getElementById('issueModelvsProj');
  var ctx = canvas.getContext('2d');
 
  issueByRootCauseBar = new Chart(ctx, config);
  issueByRootCauseBar.update();  
}

function refreshIssuebyCompany(company){ 
   
  var labels=[],dataTotals=[];colors=[];
  for(var com in company){  
    labels.push(com);
    dataTotals.push(company[com].total);
    colors.push(random_rgba())
  }

   var chartData = {
    datasets: [{
        data: dataTotals,
        backgroundColor: colors
    }],
    labels: labels
  };


  var canvas = document.getElementById('issueByCompany');
  var ctx = canvas.getContext('2d'); 
  
  issueByCompanyBar = new Chart(ctx, {
        type: 'horizontalBar', 
				data: chartData,
				options: {
          responsive: true,
          maintainAspectRatio: true,
					title: {
						display: true,
						text: 'Open Issue by Company'
					},
					tooltips: {
						mode: 'index',
						intersect: true
          },
          legend: {
            display: false 
          }  
				}
			});
      issueByCompanyBar.update();  

}

function refreshWeekDue(weekdue){

  weekdue = sortOnKeys(weekdue);

  var labels=[],dataTotal=[],dataClosed=[];
  for(var due_date in weekdue){
    labels.push(Months[new Date(Number(due_date)).getMonth()]+' ' +
                       new Date(Number(due_date)).getDate());
    dataTotal.push(weekdue[due_date].dueissue);
    dataClosed.push(weekdue[due_date].isclosed); 
   }

   var chartData = {
    labels: labels,
    datasets: [{
      type: 'bar',
      label: 'Due',
      backgroundColor: window.chartColors.red,
      data: dataTotal,
      borderColor: 'white',
      borderWidth: 2
    }, {
      type: 'bar',
      label: 'Closed',
      backgroundColor: window.chartColors.green,
      data:dataClosed
    }] 
  };

  

  var canvas = document.getElementById('issueWeekDue');
  var ctx = canvas.getContext('2d');
  
  issueByWeekDueBar = new Chart(ctx, {
				type: 'bar',
				data: chartData,
				options: {
          maintainAspectRatio: false, 
					responsive: true,
					title: {
						display: true,
						text: 'Number of Issues Due This Week'
          },
          legend: {
            display: true,
            position:'top'
          },
					tooltips: {
						mode: 'index',
						intersect: true
          },
          scales: {
            yAxes: [{
               ticks: {
                  stepSize: 1
               }
            }]
         }
				}
			});
      issueByWeekDueBar.update();  

}

function destoryAllViews(){
  if(issueByWeekDueBar)
  issueByWeekDueBar.destroy();
  if(issueByRootCauseBar)
  issueByRootCauseBar.destroy(); 
  if(issueByRootCauseBar)
  issueByRootCauseBar.destroy(); 
  if(overallStatusPie)
    overallStatusPie.destroy(); 
  if(issueByCompanyBar)
  issueByCompanyBar.destroy();
}
function checkIssueStatJob(jobId){
  jQuery.ajax({
    url: '/api/forge/issuereport/checkjob',
    contentType: 'application/json',
    type: 'GET',
    dataType: 'json',
    data:  {
      'jobId': jobId 
    },
    success: function (res) { 
      switch(res.status)
      {
        case 'working':
           setTimeout (function () { checkIssueStatJob (jobId) ; }, 2000) ;
        break;
        case 'done':
          destoryAllViews();
          $('#loader_stats').css({ display: "none" });  
           if($('#radioDocIssue_report').is(":checked") )
           {
            $.get('/api/forge/issuereport/get_docissue',function(res){
              var docIssues = JSON.parse(res); 
              refreshIssueOverview(docIssues.overview);
              refreshModelvsProjectView(docIssues.modelvsproj);
              refreshIssuebyCompany(docIssues.company);
              refreshWeekDue(docIssues.weekdue); 
            }); 
          }else{
            $.get('/api/forge/issuereport/get_fieldissue',function(res){
              var fieldIssues = JSON.parse(res); 
              refreshIssueOverview(fieldIssues.overview);
              refreshRootcause(fieldIssues.rootcause);
              refreshIssuebyCompany(fieldIssues.company);
              refreshWeekDue(fieldIssues.weekdue); 
            }); 
          }
        break;
        default:
          $('#loader_stats').css({ display: "none" });  

       } 
     },
    error: function (res) {   
      $('#loader_stats').css({ display: "none" });
      alert('get status job failed！'); 
    }
  }); 
}

function refreshDashboard(projectHref,isRefresh=true){

  var date_input = new Date($("#oneWeekDueIssueDate").val()); 
  var weekDueStart = date_input.getFullYear() 
                  +'-' + (date_input.getMonth() +1)
                  + '-' +date_input.getDate();

  jQuery.ajax({
    url: '/api/forge/issuereport/startjob',
    contentType: 'application/json',
    type: 'GET',
    dataType: 'json',
    data:  {
      'projectHref': projectHref,
      'weekDueStart':weekDueStart,
      'isDocIssue':$('#radioDocIssue_report').is(":checked"),
      'isRefresh':isRefresh 
    },
    success: function (res) {  
         $('#loader_stats').css({ display: "block" });  
        checkIssueStatJob(res.jobId);  
    },
    error: function (res) { 
      alert('get issues failed:');
    }
  });
}


$(document).ready(function () { 
  $('#oneWeekDueIssueDate').datepicker('setDate',new Date());
  $('#oneWeekDueIssueDate').datepicker({autoclose: true}); 

  $('#oneWeekDueIssueDate').change(function () { 
    if($('#labelProjectHref').text() == ''){
      alert('please select one project!');
      return;
    }
    destoryAllViews(); 

      var projectHref = $('#labelProjectHref').text();  
     if(issueByWeekDueBar){
       //update with existing data only
       refreshDashboard(projectHref,false) 
     }else{
       //refresh all data
       refreshDashboard(projectHref,true); 
     }
  });

  $('#radioFieldIssue_report').click(function () {
    $("#radioFieldIssue_report").prop("checked", true); 
    $("#radioDocIssue_report").prop("checked", false); 

    destoryAllViews(); 
     var projectHref = $('#labelProjectHref').text(); 
     refreshDashboard(projectHref,false);  
  });
  $('#radioDocIssue_report').click(function () {
    $("#radioDocIssue_report").prop("checked", true); 
    $("#radioFieldIssue_report").prop("checked", false);
    
    destoryAllViews(); 
    var projectHref = $('#labelProjectHref').text(); 
    refreshDashboard(projectHref,false); 
  }); 

  $('#btnRefresh').click(function () { 

    if($('#labelProjectHref').text() == ''){
      alert('please select one project!');
      return;
    } 
    destoryAllViews();
    var projectHref = $('#labelProjectHref').text(); 
    refreshDashboard(projectHref,true); 
  }); 

  
   



});
 