import { defineConfig } from 'vite'
export default defineConfig({
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://noncondensible-emanatively-dalilah.ngrok-free.dev',
        changeOrigin: true,
        rewrite: path => path,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  }
})
