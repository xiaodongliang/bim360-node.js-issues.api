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


var viewerApp;
var _viewer3D;

function launchViewer(urn) {
  if (viewerApp != null) {
    var thisviewer = viewerApp.getCurrentViewer();
    if (thisviewer) {
      thisviewer.tearDown()
      thisviewer.finish()
      thisviewer = null
      $("#forgeViewer").empty();
    }
  }
  var options = {
    env: 'AutodeskProduction',
    getAccessToken: getForgeToken
  };
  var documentId = 'urn:' + urn;
  Autodesk.Viewing.Initializer(options, function onInitialized() {
    viewerApp = new Autodesk.Viewing.ViewingApplication('forgeViewer');
    viewerApp.registerViewer(viewerApp.k3D, Autodesk.Viewing.Private.GuiViewer3D);
    viewerApp.loadDocument(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
  });
}

function onDocumentLoadSuccess(doc) {
  // We could still make use of Document.getSubItemsWithProperties()
  // However, when using a ViewingApplication, we have access to the **bubble** attribute,
  // which references the root node of a graph that wraps each object from the Manifest JSON.
  var viewables = viewerApp.bubble.search({ 'type': 'geometry' });
  if (viewables.length === 0) {
    console.error('Document contains no viewables.');
    return;
  }

  // Choose any of the avialble viewables
  viewerApp.selectItem(viewables[0].data, onItemLoadSuccess, onItemLoadFail);
}

function onDocumentLoadFailure(viewerErrorCode) {
  console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

function onItemLoadSuccess(viewer, item) {
  // item loaded, any custom action?
  _viewer3D = viewer; 

  //delegate the event of CAMERA_CHANGE_EVENT
  viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onGeometryLoaded); 
  
}

function onItemLoadFail(errorCode) {
  console.error('onItemLoadFail() - errorCode:' + errorCode);
}

function getForgeToken() {
  jQuery.ajax({
    url: '/api/forge/user/token',
    success: function(res) {
      token = res;
    },
    async: false
  });
  return token;
}

function onGeometryLoaded(evt){

   
  //load extension of pushpin
  _viewer3D.loadExtension('Autodesk.BIM360.Extension.PushPin')
    .then((pushPinExtension)=>{ 
      //remove last items collection
      pushPinExtension.removeAllItems();
      pushPinExtension.showAll();

      //get out the data of this pushpin
      var labelData = $('#labelPushpinParam').text(); 
      var issueData = JSON.parse(labelData);

      pushPinExtension.createItem({
          //type: issues, quality-issues or rfis
          type:issueData.type,

          //unique id 
          id: issueData.id,

          //item label
          label: issueData.title,

          //status: depending on the item type, add prefix
          status: issueData.type + '-' + issueData.status,

          //position of the issues/rfis in Forge Viewer 
          position: issueData.location,

          //object Id of the model with the issues/rfis
          objectId: issueData.object_id,

          //view state with the issues/rfis
          viewerState: issueData.viewerState


      });


      pushPinExtension.selectOne(issueData.id);

    });

}