
var express = require('express'); 
var router = express.Router(); 

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json(); 
var _ = require('lodash'); 
var url = require('url');  
 

var UserSession = require('../services/userSession');
var bimDatabase = require('../bim.database');
var issueDumpAll = require('../services/bim.issues.services.dump');
var utility = require('../utility');

var doc_issue_stats_json = null;
var field_issue_stats_json = null;

function resetStats(){
  doc_issue_stats_json = {overview:{},
                            modelvsproj:{},
                            Company:{},
                            weekdue:{}
                           };
  field_issue_stats_json = {overview:{},
    modelvsproj:{},
    rootcause:{},
    type:{},
    Company:{},
    weekdue:{}
    };
}
router.get('/issuereport/startjob',jsonParser, function (req, res) {
  
  var userSession = new UserSession(req.session);
  if (!userSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return; 
  }  
    var params = req.query.projectHref.split('/');
    var projectId = params[params.length - 1];
  var containerId = bimDatabase.getIssueContainerId(projectId) 
  var containerData = bimDatabase.getContainerData(containerId)

  if(!containerId){  
      console.log('failed to find ContainerId');
      res.status(500).end();
      return; 
  }  

  var jobId = require('../utility').randomValueBase64(6);  
  utility.storeStatus(jobId,'working') 
  res.status(200).json({jobId:jobId});  

  var hubId = containerData.hubId;
  var isDocIssue = JSON.parse(req.query.isDocIssue); 
  var isRefresh = JSON.parse(req.query.isRefresh);
  var weekDueStart = new Date(req.query.weekDueStart).getTime();

  resetStats();  
  var existingJson = bimDatabase.getDumpIssue(containerId,isDocIssue); 

  if(!isRefresh && existingJson!=null && existingJson.length>0){
        dumpDocsIssueReports(isDocIssue,
                            hubId,
                            containerId,
                            existingJson,
                            weekDueStart);
      utility.storeStatus(jobId,'done')   
  }  
  else{  
      var input = {
        credentials:userSession.getUserServerCredentials(),  
        isDocIssue:isDocIssue,
        containerId:containerId,
        jobId:jobId
       };   

       var allIssues = []; 
       issueDumpAll.refreshIssue(input,allIssues,0)
       .then(result=>{
          
          bimDatabase.refreshDumpIssue(containerId,result,isDocIssue);
           dumpDocsIssueReports(isDocIssue,
                               hubId,
                               containerId,
                               result,
                               weekDueStart);
          utility.storeStatus(jobId,'done')
       }).catch(ex=>{ 
          utility.storeStatus(jobId,'error');
       }); 
    }  
})

router.get('/issuereport/checkjob',jsonParser, function (req, res) { 

  var args = url.parse(req.url, true).query;
  var status = utility.readStatus(args.jobId)
  if(status) 
  res.status(200).json({status:status});  
  else
  res.status(500).json({error:'no such status!' + args.jobId }); 
}); 

//doc issue
router.get('/issuereport/get_docissue',jsonParser, function (req, res) { 
  if(!_.isEmpty(doc_issue_stats_json))
    res.status(200).json(JSON.stringify(doc_issue_stats_json)); 
  else
    res.status(500).json({error:'empty json'});
}); 

//field issue
router.get('/issuereport/get_fieldissue',jsonParser, function (req, res) { 
  if(!_.isEmpty(field_issue_stats_json))
  res.status(200).json(JSON.stringify(field_issue_stats_json)); 
  else
  res.status(500).json({error:'empty json'});
}); 


function dumpDocsIssueReports(isDocIssue,hubId,containerId,
                              all_issue_json,weekDueStart){ 

  var issue_stats_json = isDocIssue? doc_issue_stats_json:field_issue_stats_json;
  all_issue_json.forEach(function(eachIssue) {  

    issueOverview({status:eachIssue.attributes.status},issue_stats_json); 
    issueModelvsProject({isModelIssue:eachIssue.attributes.pushpin_attributes!=null},issue_stats_json) 

    var company = 
        utility.findUserCompany(hubId,
                                eachIssue.attributes.assigned_to,
                                eachIssue.attributes.assigned_to_type); 
    issueByCompany({company:company,isopened:eachIssue.attributes.status=='open'},issue_stats_json); 


    issueWeekDue({due_date:eachIssue.attributes.due_date,
                  isclosed:eachIssue.attributes.status=='closed'},
                  weekDueStart,issue_stats_json);
  
      issueByRootcause(eachIssue.attributes.root_cause,issue_stats_json);  
      issueByType(eachIssue.attributes.issue_type,
                    containerId,issue_stats_json);
     } 

    if(!isDocIssue)
     {
      issueByRootcause(eachIssue.attributes.root_cause,issue_stats_json);  
      issueByType(eachIssue.attributes.issue_type,
                    containerId,issue_stats_json);
     } 


  }); 
}

function issueOverview(record,issue_stats_json){  
    if(record.status in issue_stats_json.overview) 
      issue_stats_json.overview[record.status]++; 
    else
      issue_stats_json.overview[record.status] = 1; 
}

function issueModelvsProject(record,issue_stats_json){ 

  if(record.isModelIssue)
{   issue_stats_json.modelvsproj.model==null?
    issue_stats_json.modelvsproj.model=1:
    issue_stats_json.modelvsproj.model++
  }else
  {issue_stats_json.modelvsproj.notmodel==null?
    issue_stats_json.modelvsproj.notmodel=1:
    issue_stats_json.modelvsproj.notmodel++
  }
}

function issueByCompany(record,issue_stats_json){ 

  if(record.company in issue_stats_json.company){ 
  }
  else{
    issue_stats_json.company[record.company] = {};
    issue_stats_json.company[record.company]['isopen'] = 0;
    issue_stats_json.company[record.company]['total'] = 0; 
  }  

  issue_stats_json.company[record.company]['total'] ++  ; 
  if(record.isopen)
    issue_stats_json.company[record.company]['isopen'] ++ ; 
}

function issueWeekDue(record,weekDueStart,issue_stats_json){
  var dateStart = new Date(weekDueStart);
  var dateAtOneWeek = dateStart; 
  dateAtOneWeek.setDate(dateStart.getDate() + 7);
  dateAtOneWeek = dateAtOneWeek.getTime();

  var due_date = new Date(record.due_date).getTime();
  
  if(due_date>=weekDueStart && due_date<=dateAtOneWeek){
    if(due_date in issue_stats_json.weekdue){
      if(record.isclosed)
          issue_stats_json.weekdue[due_date]['isclosed'] ++ ;  
      issue_stats_json.weekdue[due_date]['dueissue'] ++  ;
    }
    else{
      issue_stats_json.weekdue[due_date] = {};
      issue_stats_json.weekdue[due_date]['dueissue'] = 1;
      record.isclosed?
         issue_stats_json.weekdue[due_date]['isclosed'] = 1:
         issue_stats_json.weekdue[due_date]['isclosed'] = 0;  
    }  
  }  
}

function issueByRootcause(root_cause,issue_stats_json){ 

  if(root_cause in issue_stats_json.rootcause) 
  issue_stats_json.rootcause[root_cause]++; 
  else
  issue_stats_json.rootcause[root_cause] = 1; 
}

function issueByType(type,containerId,issue_stats_json){ 
  var typeStr = utility.findIssueType(containerId,type)
  if(typeStr in issue_stats_json.type) 
  issue_stats_json.type[typeStr]++; 
  else
  issue_stats_json.type[typeStr] = 1; 
}

module.exports = router
