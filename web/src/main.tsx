import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { registerServiceWorker } from './push';
import './styles.css';
import { initTheme } from './theme';

initTheme();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
