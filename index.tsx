import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from 'react-hot-toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Toaster 
        position="bottom-right"
        toastOptions={{
            className: 'themed-toast',
            success: {
                iconTheme: {
                    primary: 'var(--success)',
                    secondary: 'white',
                },
            },
            error: {
                iconTheme: {
                    primary: 'var(--error)',
                    secondary: 'white',
                },
            },
        }}
    />
  </React.StrictMode>
);