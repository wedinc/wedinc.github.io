console.log(process.env.NODE_ENV)
console.log('hoge')
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  components: true,
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico'
        }
      ]
    }
  },
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    'nuxt-gtag'
  ],
  content: {
    documentDriven: true,
    highlight: {
      theme: 'monokai',
      preload: ['python']
    }
  },
  gtag: {
    id: 'G-8E7TW1CHNY'
  }
})
