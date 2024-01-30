<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts">
  useSeoMeta({
    title: 'WED Engineering Team Blog',
    ogTitle: 'WED Engineering Team Blog',
    description: 'エンジニアリングは楽しい',
    ogDescription: 'エンジニアリングは楽しい',
    ogImage: 'wed-logo.png',
    twitterCard: 'summary_large_image'
  })
  useHead({
    meta: [
      {
        name: 'google-site-verification',
        content: process.env.GOOGLE_SITE_VERIFICATION
      }
    ]
  })
</script>
