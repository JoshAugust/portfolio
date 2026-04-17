import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// GitHub Pages SPA: restore path from 404.html redirect
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('p');
if (redirectPath) {
  window.history.replaceState(null, '', decodeURIComponent(redirectPath));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
