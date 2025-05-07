import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/github-organization-search/',
  optimizeDeps: {
    include: ['react/jsx-runtime']
  },
  plugins: [svgr(), react()],
  server: {
    host: true,
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      'app': path.resolve(__dirname, './src/app'),
      'components': path.resolve(__dirname, './src/components'),
      'constants': path.resolve(__dirname, './src/constants'),
      'styles': path.resolve(__dirname, './src/styles'),
      'utils': path.resolve(__dirname, './src/utils'),
    }
  }
})
