import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {SesionProvider} from './context/SesionContext';
import App from './App';
import './index.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><SesionProvider><App/></SesionProvider></BrowserRouter></React.StrictMode>);
