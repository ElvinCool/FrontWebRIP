import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import App from './App'
import store from './store'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { dest_root } from './target_config'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={dest_root}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)