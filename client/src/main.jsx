import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios';
import App from './App.jsx'
import './index.css'

const getBackendUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl;
  
  const { protocol, hostname } = window.location;
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') || 
    hostname.startsWith('10.') || 
    hostname.startsWith('172.')
  ) {
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

axios.defaults.baseURL = getBackendUrl();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

