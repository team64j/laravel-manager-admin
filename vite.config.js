//import { splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'

export default {
  base: './',
  build: {
  //   //outDir: '../../../manager',
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        // manualChunks (id) {
        //   if (id.includes('node_modules')) {
        //     return id.toString().split('node_modules/')[1].split('/')[0].toString()
        //   }
        // },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1),
            ext = assetInfo.name.split('.').pop()

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            extType = 'img'
          } else if (/ttf|woff2/i.test(ext)) {
            extType = 'fonts'
          }

          return `assets/${extType}/[name].[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  plugins: [
    //splitVendorChunkPlugin(),
    vue()
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      '@/': '/src/js/'
    },
    extensions: ['.js', '.vue', '.json']
  }
}
