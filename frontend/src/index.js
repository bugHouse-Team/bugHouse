import React from 'react';
import ReactDOM from 'react-dom/client'; // 🔁 Note the change
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')); // 🔁 This is new
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
