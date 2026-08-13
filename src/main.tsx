import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize prerenderReady for Netlify's Prerender extension
window.prerenderReady = false;

const root = document.getElementById("root")!;
const app = <App dehydratedState={window.__REACT_QUERY_STATE__} />;
const hasSsrHtml = Boolean(window.__REACT_QUERY_STATE__) || root.children.length > 0;

if (hasSsrHtml) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

// Fallback: if no page signals ready within 5 seconds, signal anyway
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!window.prerenderReady) {
      window.prerenderReady = true;
    }
  }, 5000);
});
