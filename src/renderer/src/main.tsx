import ReactDOM from 'react-dom/client'
import './global.css'
import 'cesium/Widgets/widgets.css'

import App from './App'
import { ThemeProvider } from './components/theme-provider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>
)
