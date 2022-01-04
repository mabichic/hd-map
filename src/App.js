import Grid from '@mui/material/Grid';
import { useDispatch } from "react-redux";
import HdMap from './component/HdMap'; // context.Provider
import { gps_load_success, init, isLoading, load, load_fail, load_success, save, saved } from './reducers';
import AttributeTree from './component/AttributeTree';
import AlertDialogSlide from './component/AlertDialogSlide';
import { Button, Drawer, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { styled, useTheme } from '@mui/material/styles';
import React,{ useState } from 'react';
import { fileService, isLoadingService, mapService, messageService } from './service/message.service';
import ConfirmDialog from './component/ConfirmDialog';
import Progress from './component/Progress';
import Loading from './component/Loading';
const { ipcRenderer } = window.require("electron");


const keySetting = (e) =>{
  if(e.ctrlKey && e.code==="KeyZ"){ 
    mapService.undoredo('undo');
  }
  if(e.ctrlKey && e.code === "KeyY"){ 
    mapService.undoredo('redo');
  }
  if(e.ctrlKey && e.code === "KeyD"){ 
    mapService.selectDell('dell');
  }
}

function App() {
  document.addEventListener("keypress", keySetting, false);
  const dispatch = useDispatch();
  ipcRenderer.on('load', (event)=>{
    dispatch(load());
  });
  ipcRenderer.on('loadSuccess', (event, arg) =>{
    // console.log(arg);
    dispatch(load_success(arg));
  });
  ipcRenderer.on('gpsLoadSuccess', (event, arg)=>{
    dispatch(gps_load_success(arg));
  });

  ipcRenderer.on('init', (event)=>{
    console.log("init 명령");
    dispatch(init());
    mapService.clear();
  });
  ipcRenderer.on('loadFail', (event, msg) =>{
    dispatch(load_fail(msg));
  });
  ipcRenderer.on('drawFail', (event, msg) =>{
    messageService.sendMessage("취소",msg);
  });
  ipcRenderer.on('SaveFail', (event,msg) =>{
    messageService.sendMessage("취소",msg);
  });

  ipcRenderer.on("draw", function (event, type) {
    mapService.draw(type);
  });

  ipcRenderer.on("undo", function(event, type){
    mapService.undoredo('undo');
  });

  ipcRenderer.on("redo", function(event, type){
    mapService.undoredo('redo');
  });

  ipcRenderer.on("save", function(event, type){
    dispatch(save(type));
  });
  
  ipcRenderer.on("saved", function(event){
    dispatch(saved());
  });

  ipcRenderer.on("generationGps", function(event){
    mapService.generationGps();
  });


  const [open, setOpen] = React.useState(true);
  const elementRef = React.useRef(null);

  return (
      <Grid container sx={{height:'100vh', minWidth:'1200px'}}>
      <Grid item xs={12} sx={{height:'100%', width:'100%', backgroundColor:'#eee', minWidth:'700px'}}>
      
        <HdMap test={elementRef}/>
      </Grid>
      <Drawer
          ref = {elementRef} 
          sx={{
            width: '100%',
            maxHeight: '800px'
          }}
          variant="persistent"
          anchor="bottom"
          open={open}
        >
          <AttributeTree/>
          </Drawer>
          <AlertDialogSlide/>
          <ConfirmDialog/>
          <Loading/>
          <Progress/>          
      </Grid>
  )
}

export default App;
