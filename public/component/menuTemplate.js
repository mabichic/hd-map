/* menuTemplate.js */
const { dialog, BrowserWindow } = require('electron');
const {loadAll, fileList} = require('./menuFileModule');
const template = [
  {
    label: 'File',
            submenu: [
              { 
                  label: 'Load All',
                  click: async () => {
                    if(fileList.length<1){
                      dialog.showOpenDialog({
                        properties: ['openFile', 'openDirectory']
                      }).then(results => {
                          if (!results.canceled) {
                              // HDMapDataStructure.buildHDMapDataStructure('directory', results.filePaths, windowMainId);
                              loadAll(results.filePaths[0]);
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
                        message: 'Save current layer set.',
                        detail: 'Save changes of current layer set prior to loading another one.'
                    };

                    dialog.showMessageBox(null, options).then(result => {
                        if (result.response === 2) {
                            // save('all');
                        }

                        if ((result.response === 1) || (result.response === 2)) {
                          dialog.showOpenDialog({
                            properties: ['openFile', 'openDirectory']
                          }).then(results => {
                              if (!results.canceled) {
                                  // HDMapDataStructure.buildHDMapDataStructure('directory', results.filePaths, windowMainId);
                                  loadAll(results.filePaths[0]);
                              }
                          }).catch(err => {
                              console.log(err);
                          });
                        }
                    });
                    }
                  }
              }
            ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  }, 
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
];

module.exports = template;