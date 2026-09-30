import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PenyediaSesi } from './lib/sesi';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PenyediaSesi>
        <App />
      </PenyediaSesi>
    </BrowserRouter>
  </React.StrictMode>,
);
