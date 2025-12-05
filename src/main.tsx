import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'  // Old App (Working)
// import AppNew from './AppNew.tsx'  // New Clean Dashboard (Needs Tailwind fix)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
