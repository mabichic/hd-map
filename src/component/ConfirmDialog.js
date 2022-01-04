import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { confrimService } from '../service/message.service';



// const useConfirm = (message = "", onConfirm, onCancel) => { // message의 기본값은 "" 
//     if (!onConfirm || typeof onConfirm !== "function") { 
//         return; // 매개변수 onConfirm가 없거나 onConfirm이 함수가 아나라면 return 실행
//     }
//     if (onCancel && typeof onCancel !== "function") { // onCancle은 필수요소는 아님
//         return;
//     }
//     const confirmAction = () => { // confirm창의 응답에 따른 이벤트 실행 함수
//         if (confirm(message)) { // 확인을 눌렀다면
//             onConfirm();
//         } else { // 취소를 눌렀다면
//             onCancel();
//         }
//     };
//     return confirmAction; 
// };

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

export default function ConfirmDialog() {
    React.useEffect(() => {
        let subscription = confrimService.getMessage().subscribe(message => {
            if (message) {
            // add message to local state if not empty
            setOpen(true);
            setOnConfirm(message);
            } else {
            // clear messages when empty message received
            }
        });
        return () =>{
            subscription.unsubscribe();
        }
    });

  const [open, setOpen] = React.useState(false);
  const [onConfirm, setOnConfirm] = React.useState(null);

  const handleClose = () => {
    setOpen(false);
  };

  const confirmYes = () =>{ 
    if (typeof onConfirm?.onConfirm !== "function") { // onCancle은 필수요소는 아님
      handleClose();
      return;
    }
    onConfirm?.onConfirm();
    handleClose();
  };
  const confirmNo = () =>{ 
    if (typeof onConfirm?.onCancel !== "function") { // onCancle은 필수요소는 아님
        handleClose();
        return;
    }
    handleClose();
    onConfirm?.onCancel();
};

  return (
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
            {onConfirm?.state}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {onConfirm?.text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={confirmNo}>
            아니오
          </Button>
          <Button onClick={confirmYes}>네 </Button>
        </DialogActions>
      </Dialog>
  );
}
