import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';

import App from './App';
import { ProveedorAuth } from './lib/auth';
import { ProveedorAvisos } from './components/Aviso';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" respeta la preferencia de "reducir movimiento" del sistema. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ProveedorAuth>
          <ProveedorAvisos>
            <App />
          </ProveedorAvisos>
        </ProveedorAuth>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
