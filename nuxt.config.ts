// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', '@nuxt/content', '@nuxtjs/tailwindcss'],
  content: {
    documentDriven: true,
    highlight: {
      theme: 'monokai'
    }
  }
})
