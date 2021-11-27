import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { messageService } from '../service/message.service';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AlertDialogSlide() {

  React.useEffect(() => {
    let subscription = messageService.getMessage().subscribe(message => {
      if (message) {
        // add message to local state if not empty
        setOpen(true);
        setMsg(message.text);
        setState(message.state);
      } else {
        // clear messages when empty message received
      }
    });
    return () =>{
      subscription.unsubscribe();
    }
  });
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [state, setState] = React.useState("");
  

  const handleClose = () => {
    setOpen(false);
  };

  return (
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{state}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            <span style={{whiteSpace: "pre-wrap"}}>
            {msg}
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Ok</Button>
        </DialogActions>
      </Dialog>
  );
}