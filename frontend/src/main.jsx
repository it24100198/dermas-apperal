import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { store } from './store/store'
import ErrorBoundary from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#112244',
                color: '#ffffff',
                border: '1px solid #2a467f'
              }
            }}
          />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
