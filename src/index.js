import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from './reducers/index';
import {composeWithDevTools } from 'redux-devtools-extension';
import { StyledEngineProvider } from '@mui/material/styles';
import ReduxThunk from 'redux-thunk';
import logger from 'redux-logger';
const store = createStore(reducer,
  composeWithDevTools(applyMiddleware(ReduxThunk))
  );
ReactDOM.render(
  <Provider store = {store}>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
 </Provider>,
  document.getElementById('root')
);