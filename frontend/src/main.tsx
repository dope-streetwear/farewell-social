import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getApiUrl } from './utils/api.ts'

// Globally intercept all fetch requests to `/api/*` and prepend the correct backend URL.
// This elegantly bypasses Vercel's 4.5MB payload limit and 10s timeout proxy rules universally.
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return originalFetch(getApiUrl() + input, init);
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
