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
  useContentHead(page)
</script>
