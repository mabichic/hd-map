import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import { CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import { isLoadingService } from '../service/message.service';

export default function Progress() {
  React.useEffect(() => {
    let subscription = isLoadingService.getMessage().subscribe(message => {
      if (message) {
        setIsLoading(message.isLoading);
      } else {
      }
    });
    return () =>{
      subscription.unsubscribe();
    }
  });
  const [isLoading, setIsLoading] = React.useState(false);
  return (
    <div>
      <Dialog open={isLoading}>
        <Box sx={{overflow:"hidden", backgroundColor:"transparent"}}>
            <CircularProgress size={100} position="fixed"/>
        </Box>
      </Dialog>
    </div>
  );
}