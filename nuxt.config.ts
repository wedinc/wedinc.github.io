// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
      theme: 'monokai'
    }
  },
  gtag: {
    id: 'G-8E7TW1CHNY'
  }
})
