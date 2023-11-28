<template>
  <main>
    <article class="prose max-w-full">
      <ContentRenderer v-if="data" :value="data" />
    </article>
  </main>
</template>

<script setup lang="ts">
  const route = useRoute()
  const { data } = await useAsyncData(`get-document-${route.path}`, () =>
    queryContent(route.path).findOne()
  )

  const { page } = useContent()
  useContentHead(page)
</script>
