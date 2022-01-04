import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import { CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import { useSelector } from 'react-redux';

export default function Loading() {
  const loading = useSelector((state) => state.isLoading);
  return (
    <div>
      <Dialog open={loading}>
        <Box sx={{overflow:"hidden", backgroundColor:"transparent"}}>
            <CircularProgress size={100} position="fixed"/>
        </Box>
      </Dialog>
    </div>
  );
}