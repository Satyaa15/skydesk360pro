import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './index.css'

const recoverSpaPath = () => {
  const url = new URL(window.location.href);
  const encodedPath = url.searchParams.get('spa_path');
  if (!encodedPath) return;

  const decodedPath = decodeURIComponent(encodedPath);
  const cleanedSearch = new URLSearchParams(url.search);
  cleanedSearch.delete('spa_path');
  const remainingSearch = cleanedSearch.toString();
  const finalPath = `${decodedPath}${remainingSearch ? `${decodedPath.includes('?') ? '&' : '?'}${remainingSearch}` : ''}`;

  window.history.replaceState(null, '', finalPath);
};

recoverSpaPath();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
