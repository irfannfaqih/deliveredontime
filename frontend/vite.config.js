import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Base URL - penting untuk deployment
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Matikan sourcemap di production untuk keamanan
    sourcemap: false,
    
    // Minify untuk optimasi
    minify: 'terser',
    
    // Warning limit
    chunkSizeWarningLimit: 700,
    
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          react: ['react', 'react-dom', 'react-router-dom'],
          
          // MUI components - PENTING karena besar
          mui: [
            '@mui/material', 
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          
          // PDF utilities
          pdf: ['jspdf', 'jspdf-autotable'],
          
          // Excel utilities
          excel: ['xlsx', 'file-saver'],
          
          // Form & State management
          forms: ['react-hook-form', 'zustand'],
          
          // Utilities
          utils: ['clsx', 'tailwind-merge', 'date-fns', 'axios']
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          // Hapus variable 'ext' yang tidak digunakan
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          
          if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          
          return `assets/[name]-[hash][extname]`
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    
    // Terser options untuk minifikasi lebih agresif
    terserOptions: {
      compress: {
        drop_console: true, // Hapus console.log di production
        drop_debugger: true
      }
    }
  },
  
  // Server configuration untuk development
  server: {
    port: 5173,
    host: true, // Bisa diakses dari network
    
    // Proxy untuk API saat development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  }
})