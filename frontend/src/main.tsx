import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
        },
      }}
      richColors
    />
  </StrictMode>,
)

