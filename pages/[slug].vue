<template>
  <main>
    <ContentRenderer v-if="data" :value="data" />
  </main>
</template>

<script setup lang="ts">
  const route = useRoute()
  const { data } = await useAsyncData('get-document', () =>
    queryContent(route.path).findOne()
  )

  const { page } = useContent()
  const thumbnail = page.value.image
    ? `thumbnails/${page.value.image}`
    : 'wed-logo.png'
  useHead({
    meta: [
      {
        name: 'og:image',
        content: thumbnail
      },
      {
        name: 'twitter:card',
        content: thumbnail
      }
    ]
  })
  useContentHead(page)
</script>
