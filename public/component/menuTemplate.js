/* menuTemplate.js */
const { dialog, BrowserWindow } = require('electron');
const { webContents } = require('electron')
const {load, fileList, clear, save, fileState, gpsLoad, gpsFileList} = require('./menuFileModule');
const template = [
  {
    label: 'File',
            submenu: [
              { 
                  label: 'Load All',
                  click: async () => {
                    if(fileList.length<1||fileState.saved){
                      dialog.showOpenDialog({
                        properties: ['openFile', 'openDirectory']
                      }).then(results => {
                          if (!results.canceled) {
                              // HDMapDataStructure.buildHDMapDataStructure('directory', results.filePaths, windowMainId);
                              console.log(results);
                              load('all',results.filePaths[0]);
                          }
                      }).catch(err => {
                          console.log(err);
                      });
                    }else{
                      const options = {
                        type: 'question',
                        buttons: ['Cancel', 'No', 'Yes'],
                        defaultId: 2,
                        title: 'Warning',
                        message: '파일저장',
                        detail: '열린 레이어셋을 저장하시겠습니까? 저장하지 않은 데이터는 복구 할 수 없습니다.'
                        };

                    dialog.showMessageBox(null, options).then(result => {
                        if (result.response === 2) {
                            save('all');
                        }
                        if ((result.response === 1) ) {
                          dialog.showOpenDialog({
                            properties: ['openFile', 'openDirectory']
                          }).then(results => {
                              if (!results.canceled) {
                                  load('all',results.filePaths[0]);
                              }
                          }).catch(err => {
                              console.log(err);
                          });
                        }
                    });
                    }
                  }
              },
              {
                label : 'Load File',
                  click: async () => {
                    if(fileList.length<1||fileState.saved){
                      dialog.showOpenDialog({
                        properties: ['openFile', 'multiSelections'],
                        filters: [
                          { name: 'Text Files', extensions: ['txt'] }
                        ]
                      }).then(results => {
                          if (!results.canceled) {
                              load('file', results.filePaths);
                          }
                      }).catch(err => {
                          console.log(err);
                      });
                    }else{
                      const options = {
                        type: 'question',
                        buttons: ['Cancel', 'No', 'Yes'],
                        defaultId: 2,
                        title: 'Warning',
                        message: '파일저장',
                        detail: '열린 레이어셋을 저장하시겠습니까? 저장하지 않은 데이터는 복구 할 수 없습니다.'
                        };
                        dialog.showMessageBox(null, options).then(result => {
                          if (result.response === 2) {
                              save('all');
                          }
                          if ((result.response === 1)) {
                            dialog.showOpenDialog({
                              properties: ['openFile', 'multiSelections'],
                              filters: [
                                { name: 'Text Files', extensions: ['txt'] }
                              ]
                            }).then(results => {
                                if (!results.canceled) {
                                  load('file', results.filePaths);
                                }
                            }).catch(err => {
                                console.log(err);
                            });
                          }
                      });
                    }
                  }
                },
                {
                  label:'GPS File Load',
                  click : async () =>{
                    dialog.showOpenDialog({
                      properties: ['openFile'],
                      filters: [
                          { name: 'Text Files', extensions: ['txt'] },
                          { name: 'CSV Files', extensions: ['csv'] }
                      ]
                  }).then(results => {
                      if (!results.canceled) {
                        gpsLoad(results.filePaths);
                      }
                  }).catch(err => {
                      console.log(err);
                  });
                  },
                },
                { type: 'separator' },
                {
                  label: 'Save All',
                  click: async () => {
                    save('all');
                  }
                },
                {
                  label: 'Save LANESIDE',
                  click: async () => {
                    save('LAYER_LANESIDE')                    
                  },
                },
                {
                  label: 'Save LinkNodeSet',
                  click: async () => {
                    save('LinkNodeSet')                    
                  },
                },
                {
                  label: 'Save ROAD MARK',
                  click: async () => {
                    save('LAYER_ROADMARK')                    
                  },
                },
                {
                  label: 'Save ROAD LIGHT',
                  click: async () => {
                    save('LAYER_ROADLIGHT')                    
                  },
                },
                {
                  label: 'Save POI',
                  click: async () => {
                    save('LAYER_POI')                    
                  },
                },

            ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label : "Undo",
        click:async () =>{
          webContents.fromId(1).send('undo');
        },
        accelerator: 'Ctrl+Z' 
      },
      {
        label : "Redo",
        click:async () =>{
          webContents.fromId(1).send('redo');
        },
        accelerator: 'Ctrl+Y' 
      },
      {
        label : "GPS LOG 변환" ,
        click:async () =>{
          console.log(gpsFileList);
          if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_LN_LINK)==='undefined')){
            webContents.fromId(1).send('drawFail', "로드된 'LINK' 데이터셋이 없습니다.");
            return ;
          }else if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_LN_NODE)==='undefined')){
            webContents.fromId(1).send('drawFail', "로드된 'LINK' 데이터셋이 없습니다.");
            return ;
          }else if(gpsFileList.length<1){
            webContents.fromId(1).send('drawFail', "로드된 'GPS LOG' 데이터셋이 없습니다.");
            return ;
          }else{
            webContents.fromId(1).send('generationGps', 'GPS');
          }
        },
      },
      {
        label : 'Clear', 
        click:async() =>{
          clear();
        }

      }
    ]
  },
  {
    label: 'AddObject',
    submenu: [                
        {
            label: 'Add laneSide',
            click: async () => {
              if(fileList.length<1 || (typeof(fileList[fileList.length-1].LAYER_LANESIDE)==='undefined')){
                webContents.fromId(1).send('drawFail', "로드된 'LANESIDE' 데이터셋이 없습니다.");
                return ;
              }
              webContents.fromId(1).send('draw', 'LAYER_LANESIDE');
            }
        },
        {
            label: 'Add link',
            click: async () => {
              if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_LN_LINK)==='undefined')){
                webContents.fromId(1).send('drawFail', "로드된 'LINK' 데이터셋이 없습니다.");
                return ;
              }else{
                webContents.fromId(1).send('draw', 'LAYER_LN_LINK');
              }
            }
        },
        {
            label: 'Add node',
            click: async () => {
              if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_LN_NODE)==='undefined')){
                webContents.fromId(1).send('drawFail', "로드된 'NODE' 데이터셋이 없습니다.");
                return ;
              }else{
               webContents.fromId(1).send('draw', 'LAYER_LN_NODE');
              }
            }
        },
        {
            label: 'Add roadMark',
            click: async () => {
              if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_ROADMARK)==='undefined')){
                webContents.fromId(1).send('drawFail', "로드된 'ROADMARK' 데이터셋이 없습니다.");
                return ;
              }else{
               webContents.fromId(1).send('draw', 'LAYER_ROADMARK');
              }
            }
        },
        {
            label: 'Add roadLight',
            click: async () => {
              if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_ROADLIGHT)==='undefined')){
                webContents.fromId(1).send('drawFail', "로드된 'ROADLIGHT' 데이터셋이 없습니다.");
                return ;
              }else{
                webContents.fromId(1).send('draw', 'LAYER_ROADLIGHT');
              }
            }
        },
        {
            label: 'POI',
            click: async () => {
              if(fileList.length<1|| (typeof(fileList[fileList.length-1].LAYER_POI)==='undefined')){
                webContents.fromId(1).send('drawFail', "로드된 'POI' 데이터셋이 없습니다.");
                return ;
              }else{
                webContents.fromId(1).send('draw', 'LAYER_POI');
              }
            }
        }
    ]
},

  // {
  //   label: 'View',
  //   submenu: [
  //     {role: 'reload'},
  //     {role: 'forcereload'},
  //     {role: 'toggledevtools'},
  //     {type: 'separator'},
  //     {role: 'resetzoom'},
  //     {role: 'zoomin'},
  //     {role: 'zoomout'},
  //     {type: 'separator'},
  //     {role: 'togglefullscreen'}
  //   ]
  // },
  // {
  //   role: 'window',
  //   submenu: [
  //     {role: 'minimize'},
  //     {role: 'close'}
  //   ]
  // }, 
  // {
  //   role: 'help',
  //   submenu: [
  //     {
  //       label: 'Learn More',
  //       click () { require('electron').shell.openExternal('https://electronjs.org') }
  //     }
  //   ]
  // }
];

module.exports = template;