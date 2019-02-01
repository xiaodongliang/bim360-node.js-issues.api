# bim360-node.js-issues.api
This repository demonstrates BIM 360 Field Issues API by a couple of scenarios: basic usage, export customized CSV, issues statistic and export DWG to PDF (create issue for failure job)

[![node](https://img.shields.io/badge/nodejs-6.11.1-yellow.svg)](https://nodejs.org)
[![npm](https://img.shields.io/badge/npm-3.10.10-green.svg)](https://www.npmjs.com/)
[![visual code](https://img.shields.io/badge/visual%20code-1.28.2-orange.svg)](https://code.visualstudio.com)

[![oAuth2](https://img.shields.io/badge/oAuth2-v1-green.svg)](http://developer.autodesk.com/)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![Viewer](https://img.shields.io/badge/Viewer-v6-green.svg)](http://developer.autodesk.com/)

[![BIM-360](https://img.shields.io/badge/BIM%20360-v1-green.svg)](http://developer.autodesk.com/)
[![Design Automation](https://img.shields.io/badge/Design%20Automation-v3-green.svg)](http://developer.autodesk.com/)

[![License](http://img.shields.io/:license-mit-red.svg)](http://opensource.org/licenses/MIT)
[![Level](https://img.shields.io/badge/Level-Intermediate-blue.svg)](http://developer.autodesk.com/)


## Description
This repository demonstrates BIM 360 Field Issues API by a couple of scenarios: 
1. basic usage
2. export issues list to customized CSV with comments list or with custom fields
3. dashboard of issues statistics
4. export DWG to PDF. Create issue for failure job. Send notification to specific Slack channel with the issue link

## Thumbnail

![thumbnail](/thumbnail.gif)  


## Live version
http://au2018-bim360-issue.herokuapp.com/

# Setup
## Prerequisites
1. **BIM 360 Account**: must be Account Admin to add the app integration. [Learn about provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). 
2. **Forge Account**: Learn how to create a Forge Account, activate subscription and create an app at [this tutorial](http://learnforge.autodesk.io/#/account/). 
3. **Visual Studio**: Either Community (Windows) or Code (Windows, MacOS).
4. **Node.js**: basic knowledge with **Node.js**.
5. **JavaScript** basic knowledge with **jQuery**
6. To play with sending message to Slack for [Demo 4], please create Slack app and generate post url by [Slack tutorial](https://api.slack.com/tutorials/slack-apps-hello-world)

## Running locally
Clone this project or download it. It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/xiaodongliang/bim360-node.js-issues.api

**Visual Sutdio Code** (Windows, MacOS):

Open the folder, at the bottom-right, select **Yes** and **Restore**. This restores the packages (e.g. Autodesk.Forge) and creates the launch.json file. See *Tips & Tricks* for .NET Core on MacOS.

At the `.vscode\launch.json`, find the env vars and add your Forge Client ID, Secret and callback URL. 

To play with webhook for [Demo 4], take some tunnels tool such as [ngrok](https://ngrok.com/) to build the tunnel. e.g.
 ```
   bash ngrok http 3000
   Session Status                online                                            
   Session Expires               7 hours, 42 minutes                               
   Version                       2.2.8                                             
   Region                        United States (us)                                
   Web Interface                 http://127.0.0.1:4040                             
   Forwarding                    http://694ccafe.ngrok.io -> localhost:3000        
   Forwarding                    https://694ccafe.ngrok.io -> localhost:3000       
                                                                                
   Connections                   ttl     opn     rt1     rt5     p50     p90       
                              0       0       0.00    0.00    0.00    0.00 
 ```
Also for [Demo 4],apply post message url of Slack, e.g. generate post url by [Slack tutorial](https://api.slack.com/tutorials/slack-apps-hello-world). 

The end result should be as shown below:

```json
"env": { 
    "FORGE_CLIENT_ID": "your id here",
    "FORGE_CLIENT_SECRET": "your secret here",
    "FORGE_CALLBACK_URL": "http://localhost:3000/api/forge/callback/oauth", 
    "FORGE_WEBHOOK_URL":"http://694ccafe.ngrok.io/webhook/itemAdded", 
    "SLACK_POST_MESSAGE_URL": "https://hooks.slack.com/services/<<XXXXX>>"
},
```


## Deployment

To deploy this application to Heroku, the **Callback URL** for Forge must use your `.herokuapp.com` address. After clicking on the button below, at the Heroku Create New App page, set your Client ID, Secret and Callback URL for Forge.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/xiaodongliang/bim360-node.js-issues.api)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy samples to Heroku.

## Demonstrations

### Demo 1: Basic Usage of Issue API
1. Select one project in the left panel tree.
2. select one due date on the top of the issue tree. The issues at the specific due date will be listed.
3. expand the attributes to check the values
4. click pushpin attributes if it is not null. The corresponding model will be loaded and the issue pushpin will be added by Pushpin Extension
5. fill in issue title and due date, click [create issue], one new issue will be created. 
6. select one issue in the issue tree, fill in comment body, and click [create comments], one new comment will be attached to the issue
7. select one issue in the issue tree, select one local photo, then click [Attach Image]. after while, expand the node of attachments of the issue to check if the file is attached. 
8. Go to BIM 360 >> Field Management >> Issue tab to check if the new issue is created, check its attachments/comments.

![thumbnail](help/basic.png)   

### Demo 2: Export Customized CSV
1. Select one project in the left panel tree.
2. Check [Field Issue] or [Document Issue], tick [With Comments] or [With Custom Fields] 
3. click [Export]. an CSV will be generated 
note： currently, the sample has not implemeted Excel export. The button is for placing hold.

![thumbnail](help/export.png)   


### Demo 3: Dashboards of Issues Statistic

1. Select one project in the left panel tree.
2. The dashboard will be refreshed. Or  click [Refesh] button to ask for refreshing
3. select [due date] of [Number of Issues due at this week] will regenerate the view with those issues will due at specific week
![thumbnail](help/dashboard.png)   


### Demo 4: Export DWG to PDF (create issue with failure job)
In this demo, a custom activity of Forge Design Automation will be used to export DWG to PDF. To create such activity, follow the steps on [Design Automation API help](https://forge.autodesk.com/en/docs/design-automation/v3/tutorials/)

A Postman scripts are available for creating. Input your Forge credential, get token, create dickname, create activity, create activity alias, and finally get all activities to check the final name.
After the activity is ready, input the activity name to [config](./server/config.js) file

1. Select one project in the left panel tree.
2. select source files folder in [Select Source Folder]
3. select target files folder in [Select Target Folder]
3. click [Batch Export]. All files will be exported by PDF action of AutoCAD Design Automation. IF any of them failed with the action, a log file will be uploaded to the target folder, and a Field issue will be created with the log as attachment
note： 
```diff
- Plan folder has special behavior with PDF files. So currently, please use other folders to test.
````
4. if Slack webhook is delegated, a notification will be sent to Slack channel, click the link of Slack message, it will direct back to that issue of BIM 360.

![thumbnail](help/integration.png)   
 

# Further Reading
- [BIM 360 API](https://developer.autodesk.com/en/docs/bim360/v1/overview/) and [App Provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps)
- [Data Management API](https://developer.autodesk.com/en/docs/data/v2/overview/)
- [Viewer](https://developer.autodesk.com/en/docs/viewer/v6)
- [Design Automation API](https://forge.autodesk.com/en/docs/design-automation/v2/developers_guide/overview/)


Tutorials:

- [View BIM 360 Models](http://learnforge.autodesk.io/#/tutorials/viewhubmodels)
- [Retrieve Issues](https://developer.autodesk.com/en/docs/bim360/v1/tutorials/retrieve-issues)

Blogs:

- [Forge Blog](https://forge.autodesk.com/categories/bim-360-api)
- [Field of View](https://fieldofviewblog.wordpress.com/), a BIM focused blog

### Tips & Tricks

1. to make simple demo, this sample code does not use database to store the issue list. While in reality, it should be the administrator who can refresh the issue list. The refresh should be stored to a database. 

### Troubleshooting

1. **Cannot see my BIM 360 projects**: Make sure to provision the Forge App Client ID within the BIM 360 Account, [learn more here](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). This requires the Account Admin permission.
 
## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Xiaodong Liang [@coldwood](https://twitter.com/coldwood), [Forge Partner Development](http://forge.autodesk.com)
