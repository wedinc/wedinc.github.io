<template>
  <main>
    <article class="prose">
      <ContentRenderer v-if="data" :value="data" />
    </article>
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
