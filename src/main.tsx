import { hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize prerenderReady for Netlify's Prerender extension
window.prerenderReady = false;

hydrateRoot(
  document.getElementById("root")!,
  <App dehydratedState={window.__REACT_QUERY_STATE__} />
);

// Fallback: if no page signals ready within 5 seconds, signal anyway
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!window.prerenderReady) {
      window.prerenderReady = true;
    }
  }, 5000);
});
