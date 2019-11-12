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

//store the info of hubs, projects,users, containers, issues list
var bimDatabase={}

module.exports = {
  hubs:function(){return bimDatabase.hubs},
  addOneHub:function(hubId){
    if(!(hubId in bimDatabase))
      {  
        bimDatabase[hubId]={};
        bimDatabase[hubId].projects = {};
        bimDatabase[hubId].users=[];  
      }
    },
    refreshUsers:function(hubId,users){
      if(hubId in bimDatabase) 
        bimDatabase[hubId].users=users; 
    },
    addOneProject:function(hubId,projectId){
      if(hubId in bimDatabase)
         if(!(projectId in bimDatabase[hubId].projects)){
           bimDatabase[hubId].projects[projectId] = {}; 
           bimDatabase[hubId].projects[projectId].rootFolderId = null;
           bimDatabase[hubId].projects[projectId].issueContainerId = null;
           bimDatabase[hubId].projects[projectId].photoFolderId = null;
           bimDatabase[hubId].projects[projectId].fieldRootcauses = null;
           bimDatabase[hubId].projects[projectId].fieldIssueTypes = null;
           bimDatabase[hubId].projects[projectId].companies = null;
           bimDatabase[hubId].projects[projectId].roles = null; 
           bimDatabase[hubId].projects[projectId].issuetype = null; 
         }
      },
      refreshProjectInfo:function(hubId,projectId,v){
        if(hubId in bimDatabase && projectId in bimDatabase[hubId].projects){
          if(v.rootFolderId)
            bimDatabase[hubId].projects[projectId].rootFolderId = v.rootFolderId;
          if(v.issuesContainerId) 
            {
              bimDatabase[hubId].projects[projectId].issuesContainerId = v.issuesContainerId;
              //for easy search, put some info of container in the first level.
              bimDatabase[v.issuesContainerId] = {}
              bimDatabase[v.issuesContainerId].hubId = hubId
              bimDatabase[v.issuesContainerId].projectId = projectId 
              bimDatabase[v.issuesContainerId].doc_all_issue_json = {};
              bimDatabase[v.issuesContainerId].field_all_issue_json = {}; 
            }
          if(v.rootFolderContents)  
            bimDatabase[hubId].projects[projectId].rootFolderContents = v.rootFolderContents;
          if(v.fieldRootcauses)  
            bimDatabase[hubId].projects[projectId].fieldRootcauses = v.fieldRootcauses;
          if(v.fieldIssueTypes)   
            bimDatabase[hubId].projects[projectId].fieldIssueTypes = v.fieldIssueTypes;
          if(v.issuetype)   
            bimDatabase[hubId].projects[projectId].IssueType = v.issuetype;
          if(v.projectName)   
            bimDatabase[hubId].projects[projectId].projectName = v.projectName; 
          if(v.companies)   
            bimDatabase[hubId].projects[projectId].companies = v.companies; 
          if(v.roles)   
            bimDatabase[hubId].projects[projectId].roles = v.roles; 
        }  
      },
      getProjectRootContents:function(hubId,projectId){
        if(hubId in bimDatabase && projectId in bimDatabase[hubId].projects ) 
          return bimDatabase[hubId].projects[projectId].rootFolderContents;
        else 
          return null;
      },
      getIssueContainerId:function(projectId){
        for(var hubId in bimDatabase){
          if(projectId in bimDatabase[hubId].projects)
             return bimDatabase[hubId].projects[projectId].issuesContainerId;
        }
      },
      getPhotoFolderId:function(projectId){
        for(var hubId in bimDatabase){
          if(projectId in bimDatabase[hubId].projects)
            {
              var photoFolder = 
              bimDatabase[hubId].projects[projectId].rootFolderContents.filter(function (item) 
              { return item.text === 'Photos'; })
              if (photoFolder && photoFolder.length && photoFolder.length > 0)
                return photoFolder.id;
              else 
                return null;
            }
        }
      },
      getPhotoFolderId:function(projectId){
        for(var hubId in bimDatabase){
          if(projectId in bimDatabase[hubId].projects)
            {
              var photoFolder = 
              bimDatabase[hubId].projects[projectId].rootFolderContents.filter(function (item) 
              { return item.text === 'Photos'; })
              if (photoFolder && photoFolder.length && photoFolder.length > 0)
                return photoFolder[0].id;
              else 
                return null;
            }
        }
      },
      getIssueTypesByContainer:function(containerId){
        for(var hubId in bimDatabase){ 
          for(var projectId in bimDatabase[hubId].projects){
            if(bimDatabase[hubId].projects[projectId].issuesContainerId == containerId) 
              return bimDatabase[hubId].projects[projectId].fieldIssueTypes; 
          } 
        }  
      },
      getRootcauseByContainer:function(containerId){
        for(var hubId in bimDatabase){ 
          for(var projectId in bimDatabase[hubId].projects){
            if(bimDatabase[hubId].projects[projectId].issuesContainerId == containerId) 
              return bimDatabase[hubId].projects[projectId].fieldRootcauses; 
          } 
        }  
      },
      getCompaniesByContainer:function(containerId){
        for(var hubId in bimDatabase){ 
          for(var projectId in bimDatabase[hubId].projects){
            if(bimDatabase[hubId].projects[projectId].issuesContainerId == containerId) 
              return bimDatabase[hubId].projects[projectId].companies; 
             } 
        }  
      },
      getissuetypeByContainer:function(containerId){
        for(var hubId in bimDatabase){ 
          for(var projectId in bimDatabase[hubId].projects){
            if(bimDatabase[hubId].projects[projectId].issuesContainerId == containerId) 
              return bimDatabase[hubId].projects[projectId].issuetype; 
          } 
        }  
      },
      getRolesByContainer:function(containerId){
        for(var hubId in bimDatabase){ 
          for(var projectId in bimDatabase[hubId].projects){
            if(bimDatabase[hubId].projects[projectId].issuesContainerId == containerId) 
              return bimDatabase[hubId].projects[projectId].roles; 
          } 
        }  
      },
      refreshDumpIssue:function(containerId,_json,isDoc){
        if(containerId in bimDatabase)
            isDoc?bimDatabase[containerId].doc_all_issue_json = _json:
                  bimDatabase[containerId].field_all_issue_json = _json; 
      },
      getDumpIssue(containerId,isDoc) 
      {
        if(containerId in bimDatabase)
           if(isDoc)
             return bimDatabase[containerId].doc_all_issue_json
           else
            return  bimDatabase[containerId].field_all_issue_json
        else 
           return null; 
      },
      getContainerData:function(containerId){
        if(containerId in bimDatabase)
          return bimDatabase[containerId]
        else
          return null;
      },
      getHubUsers:function(hubId){
        if(hubId in bimDatabase)
            return bimDatabase[hubId].users
      },
      getProjectInfo:function(projectId){
        for(var hubId in bimDatabase){
          if(projectId in bimDatabase[hubId].projects)
             return bimDatabase[hubId].projects[projectId];
        }
      } 
 }
