import { resolve, join } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const cesiumBaseUrl = 'src/assets/Cesium'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    define: {
      CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl)
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        cesium: resolve('src/renderer/src/assets/Cesium')
      }
    }
  }
})
