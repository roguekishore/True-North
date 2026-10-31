import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; 
import './firebase'; 
import store from './store';
import { Provider } from 'react-redux';

// Apply saved theme early so initial render uses correct variables
try {
  const savedTheme = localStorage.getItem('site-theme') || 'dark';
  document.documentElement.dataset.theme = savedTheme;
} catch (e) {
  // console.error('Failed to apply saved theme', e);
}

if (import.meta.env.MODE === "production") {
  const swUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/service-worker.js`;
  navigator.serviceWorker?.register?.(swUrl).then((registration) => {
    // console.log("Service Worker registered: ", registration);
  }).catch((error) => {
    // console.log("Service Worker registration failed: ", error);
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
