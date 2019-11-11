
var express = require('express');
var request = require('request');

var router = express.Router(); 

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json(); 

var createCsvWriter = require('csv-writer').createObjectCsvWriter;
var PromisePool = require("es6-promise-pool"); 
var fs = require('fs');  
var path = require('path');
var url = require('url');  


var UserSession = require('../services/userSession');
var utility = require('../utility');
var issueDumpAll = require('../services/bim.issues.services.dump');
var bimDatabase = require('../bim.database');
var bimIssuesServicesRead = require('../services/bim.issues.services.read'); 


router.get('/issuecsv/downloadCSV', function (req, res) {

    var args = url.parse(req.url, true).query; 
    var jobId = args.jobId;  
   
    var file_full_csv_name = path.join(__dirname, 
        '/../downloads/' + jobId + '.csv');   
    if(fs.existsSync(file_full_csv_name)){ 
        res.download(file_full_csv_name);  
    }
    else{
        res.status(500).json({error:'no such csv!' + jobId} );   
    } 
});

router.get('/issuecsv/checkjob',jsonParser, function (req, res) { 
    var args = url.parse(req.url, true).query;
    var status = utility.readStatus(args.jobId)
    if(status) 
    res.status(200).json({status:status});  
    else
    res.status(500).json({error:'no such status!' + args.jobId }); 
});
  
router.get('/issuecsv/startjob',jsonParser, function (req, res) {
    
    try{
        var userSession = new UserSession(req.session);
        if (!userSession.isAuthorized()) {
        res.status(401).end('Please login first');
        return;
        }   

        var params = req.query.projectHref.split('/');
        var projectId = params[params.length - 1];
        var containerId = bimDatabase.getIssueContainerId(projectId) 
        if(!containerId){  
            console.log('failed to find ContainerId');
            res.status(500).end();
            return; 
        }  
        var containerData = bimDatabase.getContainerData(containerId)  
        var hubId = containerData.hubId;
        var isDocIssue = JSON.parse(req.query.isDocIssue);  
        var isCSV = JSON.parse(req.query.isCSV);  
        var withComments  = JSON.parse(req.query.withComments);  
        var withCustomFields = JSON.parse(req.query.withCustomFields); 
        var isOnePage = JSON.parse(req.query.isOnePage);  

        if(isOnePage){
            var pageoffset = JSON.parse(req.query.pageoffset);  
            var input = {
                hubId:hubId,
                isDocIssue:isDocIssue,
                isCSV:isCSV,
                withComments:withComments,
                withCustomFields:withCustomFields,
                containerId:containerId,  
                pageoffset:pageoffset,
                credentials:userSession.getUserServerCredentials(),  
             };
            
            getOnePage(input,res);

        }else{
            var projectName = bimDatabase.getProjectInfo(projectId).projectName;
            var prefix = isDocIssue?'-Document':'-Field'
            var date = new Date();  
        
            var jobId = 'Issues - ' 
                        + date.getFullYear()
                        + '.' + (date.getMonth() + 1)
                        + '.' + date.getDate()
                        + '.' + date.getHours()
                        + '.' + date.getMinutes() 
                        + '.' + date.getSeconds()
                            ;
        
            utility.storeStatus(jobId,'working'); 
            //we can tell client the job started.
            res.status(200).json({jobId:jobId});  
        
            var input = {
                hubId:hubId,
                isDocIssue:isDocIssue,
                withComments:withComments,
                withCustomFields:withCustomFields,
                containerId:containerId,  
                credentials:userSession.getUserServerCredentials(), 
                jobId:jobId 
             };    

            writeToCSV(input);

        } 
       
    }
    catch(ex){
        res.status(500).end(); 
    }
});  

  function buildCSVHeader(input){ 
      var header = [
              {id: 'id', title: 'id'}, 
              {id: 'title', title: 'Title'},
              {id: 'description', title: 'Description'}, 
              {id: 'location', title: 'Location'},  
              {id: 'status', title: 'Status'}, 
              {id: 'assigned_to', title: 'Assigned To'}, 
              {id: 'assignee_type', title: 'Assignee Type'}, 
              {id: 'company', title: 'Company'}, 
              {id: 'due_date', title: 'Due Date'},
              {id: 'pushpin', title: 'Associated to Document?'}, 
              {id: 'created_at', title: 'Create At'}, 
              {id: 'created_by', title: 'Create By'},
              {id: 'updated_at', title: 'Updated At'}, 
              {id: 'attachments', title: 'Attachment'} 
          ]
      
       if(input.withComments)
             header.push( {id: 'comments', title: 'Comments'})
       if(!input.isDocIssue){
        header.push({id: 'rootcause', title: 'Root Cause'})
        header.push({id: 'issuetype', title: 'Issue Type'}),
        header.push({id: 'subissuetype', title: 'Sub Issue Type'}), 
        header.push({id: 'associateChecklist', title: 'Associated to checklist?'}) 
        //check custom fields
        if(input.withCustomFields && input.allIssues[0].attributes.custom_attributes){
             var customFields = input.allIssues[0].attributes.custom_attributes;
            for(var i in customFields)
               header.push({id: 'custom'+i, title: customFields[i].title}) ; 
        }
      }

      return header;
  }

  function makeRecord(input,eachIssue,comments){ 

    var thisRecord = {
        id:eachIssue.attributes.identifier,
        title:eachIssue.attributes.title,
        description:eachIssue.attributes.description, 
        location:eachIssue.attributes.location_description,
        status:eachIssue.attributes.status, 
        assigned_to: utility.checkAssignTo(input.hubId,
                         input.containerId,
                         eachIssue.attributes.assigned_to_type,
                         eachIssue.attributes.assigned_to), 
        assignee_type:eachIssue.attributes.assigned_to_type,
        company: utility.findUserCompany(input.hubId,
                    eachIssue.attributes.assigned_to,
                    eachIssue.attributes.assigned_to_type),
        due_date:eachIssue.attributes.due_date, 
        pushpin:eachIssue.attributes.pushpin_attributes==null?'null':'Yes',
        created_at:eachIssue.attributes.created_at, 
        created_by:utility.checkAssignTo(input.hubId,
                                        'user',
                                        eachIssue.attributes.created_by),
        updated_at:eachIssue.attributes.updated_at, 
        attachment:eachIssue.attributes.attachment_count 
    }

    if(input.withComments)
         thisRecord.comments=comments;

    if(!input.isDocIssue){
        thisRecord.rootcause = eachIssue.attributes.root_cause;
        thisRecord.issuetype = utility.findIssueType(input.containerId,eachIssue.attributes.ng_issue_type_id);
        thisRecord.subissuetype = utility.findSubIssueType(input.containerId,eachIssue.attributes.ng_issue_subtype_id);
        thisRecord.associateChecklist = 'NO';
        if(input.withCustomFields && eachIssue.attributes.custom_attributes){
            var customFields = eachIssue.attributes.custom_attributes;
            for(var i in customFields)
                thisRecord['custom'+i] =  customFields[i].value;
        } 
    }
    return thisRecord;
  }

  function getOnePage(input,res){ 

   bimIssuesServicesRead.getIssuesOnePage(input)
    .then(result=>{
        input.allIssues = result.issues;
        return generateRecords(input);
    }).then(result=>{
        res.writeHead(200, {"Content-Type": "application/json"}); 
        res.status(200).end(JSON.stringify(result.records))
    }).catch(ex=>{ 
        res.status(500).end();
    });   

  }

  function writeToCSV(input){
    

    var allIssues = [];
    issueDumpAll.refreshIssue(input,allIssues,0)
    .then(result=>{ 
        input.allIssues = result;
        var csvHeader = buildCSVHeader(input);  
        input.csvHeader = csvHeader;
        return generateRecords(input);
    }).then(result=>{
        utility.storeStatus(input.jobId,'done'); 

        var file_full_csv_name = path.join(__dirname, 
            '/../downloads/' + input.jobId + '.csv'); 
        const csvWriter = createCsvWriter({
            path: file_full_csv_name,
            header: input.csvHeader
        });
        csvWriter.writeRecords(result.records)   
    }).catch(ex=>{ 
        utility.storeStatus(ex.jobId,'error');
    });    

  }

  function generateRecords(input){ 
  
    return new Promise((resolve,reject)=>{  

        var loopIndex = 0;
        var tasks = [];
        var csvRecord = [];

        input.allIssues.forEach(function(el) { 
            
        var x = eachIssue=>
            new Promise(function(resolve, reject) {
    
            var eachInput = {containerId: input.containerId,
                            credentials:input.credentials,
                            issueId:eachIssue.id,
                            isDocIssue:input.isDocIssue
                            };
    
            bimIssuesServicesRead.getOneIssueComments(eachInput)
                .then(function(result) {
                //make a CSV record 
                var comments = '';
                for(var index in result) 
                    comments += ' [' + result[index].attributes.created_at + '] ' + 
                                    result[index].attributes.body + '\n';
                    
                csvRecord.push(makeRecord(input,eachIssue,comments));   
                resolve({}); 
                })  
                .catch(function(result) { 
                reject({});
                });
        });
        tasks.push({ fun: x, param: el });
    
        if (++loopIndex == input.allIssues.length) {
            const promiseProducer = () => {
                while (tasks.length) {
                const task = tasks.shift(); 
                return task.fun(task.param); 
                }
                return null;
            }; 
            const pool = new PromisePool(promiseProducer, 30);
            const poolPromise = pool.start();
    
            poolPromise.then(() => { 
                    resolve({records:csvRecord})
                }).catch(error =>{ 
                    reject({error:error});
                }); 
            } 
        });  
    });
}

  module.exports = router