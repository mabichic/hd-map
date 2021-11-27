import Grid from '@mui/material/Grid';
import { useDispatch } from "react-redux";
import HdMap from './component/HdMap'; // context.Provider
import { loadAll } from './reducers';
import AttributeTree from './component/AttributeTree';
import AlertDialogSlide from './component/AlertDialogSlide';
import { Button, Drawer, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { styled, useTheme } from '@mui/material/styles';
import React,{ useState } from 'react';
import { messageService } from './service/message.service';
const { ipcRenderer } = window.require("electron");

const drawerHeight = 240;
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    width:'100%',
    padding: theme.spacing(0),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginBottom: `-${drawerHeight}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginBottom: 0,
      width:'100%'
    }),
  }),
);

function App() {
  const dispatch = useDispatch();
  ipcRenderer.on('loadAll', (event, arg) =>{
    dispatch(loadAll(arg));
  });
  ipcRenderer.on('loadFail', (event) =>{
    messageService.sendMessage("취소","파일이 존재하지 않는 폴더입니다.");
  });
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  

  return (
      <Grid container sx={{height:'100vh', minWidth:'1200px'}}>
      <Grid item xs={12} sx={{height:'100%', width:'100%', backgroundColor:'#eee', minWidth:'700px'}}>
        <HdMap/>
      </Grid>
      <Drawer
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
      </Grid>
  )
}

export default App;
