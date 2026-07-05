import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/nunito/300.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/800.css'
import '@fontsource/pixelify-sans/400.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/glass.css'
import './styles/app.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
