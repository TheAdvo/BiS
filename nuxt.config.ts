import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/eslint',
    'shadcn-nuxt',
  ],

  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor dependencies for better caching
            'vendor-ui': ['reka-ui', 'lucide-vue-next'],
            'vendor-utils': ['@vueuse/core', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            'vendor-validation': ['vee-validate', 'zod']
          }
        }
      }
    }
  },

  // Optimize bundle size
  build: {
    analyze: process.env.ANALYZE === 'true'
  },

  // Configure auto-imports for better tree-shaking
  imports: {
    transform: {
      exclude: [/\bdefaultExport\b/]
    }
  },

  // Suppress Vue warnings and Node.js deprecation warnings
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('tradingview-')
    }
  },

  // Suppress console warnings in development
  runtimeConfig: {
    public: {
      suppressWarnings: process.env.NODE_ENV === 'development'
    }
  },

  // Suppress Node.js deprecation warnings from third-party packages
  nitro: {
    experimental: {
      wasm: true
    },
    // Add headers for better third-party embed support
    routeRules: {
      '/**': {
        headers: {
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    }
  }
})