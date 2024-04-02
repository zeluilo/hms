import React from 'react';
import ReactDOM from 'react-dom/client';

// css
import './index.css';

// other
import App from './components/containers/App';


const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

