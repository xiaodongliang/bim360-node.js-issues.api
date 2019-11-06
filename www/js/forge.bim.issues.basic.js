const global_oAuth = new oAuth()
const global_dmProjects = new DMProjects()  
const global_msSet = new MSSet()
const global_clashRawView= new ClashRawView() 
const global_clashBreakdownView= new ClashBreakdownView()
const global_clashMatrixView= new ClashMatrixView()  
const global_ClashPDF = new ClashPDF() 
const global_forgeViewer= new ForgeViewer()
const global_navHelp= new NavHelp()
const global_Utility = new Utility()

$(document).ready(function () {

 
  $('#iconlogin').click(global_oAuth.forgeSignIn);

  var currentToken = global_oAuth.getForgeToken(); 

  if (currentToken === '')
    $('#signInButton').click(global_oAuth.forgeSignIn); 
  else {
    (async()=>{
      let profile = await global_oAuth.getForgeUserProfile() 
      
      $('#signInProfileImage').removeClass();  
      $('#signInProfileImage').html('<img src="' + profile.picture + '" height="30"/>')
      $('#signInButtonText').text(profile.name);
      $('#signInButtonText').attr('title', 'Click to Sign Out');
      $('#signInButton').click(global_oAuth.forgeLogoff); 
    
      let r = await global_dmProjects.refreshBIMHubs()
      if(!r)
        return
      
      //delegate the event when one hub is selected
      delegateHubSelection()
      //delegate the event when one project is selected
      delegateProjectSelection() 
      //delegate the event when one modelset is selected 
      delegateModelsetSelection()
      //delegate the event when one table item is selected
      delegateBreakdownModelChange() 
      //delegate the event when search items within breakdown list
      delegateBreakdownSearch()
      //delegate event when refresh MC icon is clicked
      delegateRefreshMC() 
      //delegate event when refresh Clash icon is clicked
      delegateRefreshClash()
      //
      delegateExportPDF()
    })() 
  } 
  //initialize the helps
  global_navHelp.init()   

});   

function delegateHubSelection(){ 
  $(document).on('click', '#hubs_list a', function(e) {
    $('#hub_dropdown_title').html($(this).html());
    const hub_id_without_b = $(this).attr('id')
    const hub_id_with_b = 'b.' + hub_id_without_b
    global_dmProjects.refreshProjects(hub_id_with_b) 
    $('#hubs_list .active').removeClass('active');
     $(this).toggleClass('active') 
  });
}

function delegateProjectSelection(){ 
  $(document).on('click', '#projects_list a', function(e) {
    $('#project_dropdown_title').html($(this).html());
    const proj_id_without_b = $(this).attr('id')
    global_msSet.refreshModelSets(proj_id_without_b) 

     $('#projects_list .active').removeClass('active');
     $(this).toggleClass('active') 
  }); 
}

function delegateModelsetSelection(){
    $(document).on('click', '#modelsetList .list-group-item', function(e) {
      $('#modelsetList .active').removeClass('active')
      $(this).toggleClass('active') 

      const mc_containter_id =  $('#projects_list .active').attr('id')
      const ms_id =  $(this).attr("id");   
      const ms_v_id =  $(this).find("span")[0].innerHTML.replace('v-','');

      (async(mc_containter_id,ms_id,ms_v_id)=>{

        $('#clashviewSpinner').css({ display: "block" })
        $('#forgeSpinner').css({ display: "block" })

        //refresh clash data
        let r = await global_msSet.refreshOneModelset(mc_containter_id,ms_id,ms_v_id) 
        if(r)
          r = await global_clashRawView.getRawData(mc_containter_id,ms_id,ms_v_id) 
        if(r)
          r = await global_clashMatrixView.produceClashMatrixTable(mc_containter_id,ms_id,ms_v_id) 
        if(r)
           r = await global_clashBreakdownView.initBreakdownList(mc_containter_id,ms_id,ms_v_id)
        if(r)
          global_forgeViewer.launchViewer(global_msSet._docsMap)

        $('#clashviewSpinner').css({ display: "none" })
        $('#forgeSpinner').css({ display: "none" })
 
      })(mc_containter_id,ms_id,ms_v_id)
  })
}

function delegateBreakdownModelChange(){
  $(document).on('click', '#models_list .dropdown-item', function(e) {
    const docName = $(this).html() 
    $('#models_dropdown_title').html(docName);
    global_clashBreakdownView.produceBreakdownView(docName)
  })  
}
 
function delegateExportPDF(){
  $(document).on('click', '#btnExportPDF', function(e) {

      const mc_containter_id =  $('#projects_list .active').attr('id');  
      if(!mc_containter_id) return
      const ms_id =  $('#modelsetList .active').attr("id"); 
      if(!ms_id) return 
      const ms_v_id =  $('#modelsetList .active').find("span")[0].innerHTML.replace('v-',''); 
      if(!ms_v_id) return

      var checked_clashes = []; 
      $("#breakdownTree").jstree("get_checked",true).forEach(item=>{ 
         if(item.data && item.data.clashes && item.data.level == 3){
          checked_clashes = checked_clashes.concat(item.data.clashes)
         } 
      }) 
      if(checked_clashes.length > 30){
        alert('To have better export performance, please select no more than 30 clashes!') 
      }else{
        (async(mc_containter_id,ms_id,ms_v_id)=>{
          //add spinning 
          var exportbtn = $('#btnExportPDF')
          let i = document.createElement("i")
          i.classList.add('spinner-border')
          i.classList.add('spinner-border-sm') 
          exportbtn.append(i) 
          $('#btnExportPDF').contents().filter(function() {
            return this.nodeType == 3 && this.textContent.trim();
          })[0].textContent = 'Exporting...'
          exportbtn.prop('disabled', true); 

          await global_ClashPDF.exportPDF(mc_containter_id,ms_id,ms_v_id,checked_clashes)

          //remove spinning
          exportbtn.prop('disabled', false); 
          exportbtn.remove(i)
          $('#btnExportPDF').contents().filter(function() {
            return this.nodeType == 3 && this.textContent.trim();
          })[0].textContent = 'Exporting...'
          exportbtn.text('Export PDF') 

        })(mc_containter_id,ms_id,ms_v_id)
      }  
    }) 
} 

function delegateRefreshMC(){
  $(document).on('click', '#btnRefreshMC', function(e) {
    const proj_id_without_b =  $('#projects_list .active').attr('id');  
    if(proj_id_without_b) 
      global_msSet.refreshModelSets(proj_id_without_b) 
  }) 
}  

function delegateBreakdownSearch(){ 
  $(document).on('keyup','#search-input',function(e){
    var searchString = $(this).val();
    $('#breakdownTree').jstree('search', searchString);
  })  
}

function delegateRefreshClash(){
  $(document).on('click', '#btnRefreshClash', function(e) {
    const mc_containter_id =  $('#projects_list .active').attr('id');  
    const ms_id =  $('#modelsetList .active').attr("id");   
    const ms_v_id =  $('#modelsetList .active').find("span")[0].innerHTML.replace('v-',''); 
    //refresh clash data

    (async(mc_containter_id,ms_id,ms_v_id)=>{
      //refresh clash data
      let r = await global_msSet.refreshOneModelset(mc_containter_id,ms_id,ms_v_id)
      if(r)
         r = await global_clashRawView.produceClashRawTable(mc_containter_id,ms_id,ms_v_id,true)
      if(r)
         global_forgeViewer.launchViewer(global_msSet._docsMap)

    })(mc_containter_id,ms_id,ms_v_id)  
    
  })
     
}  
 

