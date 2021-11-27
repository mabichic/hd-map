import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from './reducers/index';
import { StyledEngineProvider } from '@mui/material/styles';
const store = createStore(reducer);
ReactDOM.render(
  <Provider store = {store}>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
 </Provider>,
  document.getElementById('root')
);