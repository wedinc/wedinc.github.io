// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@vueuse/nuxt',
    '@nuxt/content',
    ['@nuxtjs/google-gtag', { id: 'G-8E7TW1CHNY' }],
    '@nuxtjs/tailwindcss'
  ],
  content: {
    documentDriven: true,
    highlight: {
      theme: 'monokai'
    }
  }
})
