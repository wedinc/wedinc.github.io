<template>
  <main>
    <ContentDoc />
  </main>
</template>

<script setup lang="ts">
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
  // const route = useRoute()
  // const { data } = await useAsyncData('get-document', () =>
  //   queryContent(route.path).findOne()
  // )

  // console.log({ data, page })
</script>
