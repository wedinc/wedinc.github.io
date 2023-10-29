<template>
  <main>
    <ContentDoc />
  </main>
</template>

<script setup lang="ts">
  const { page } = useContent()
  useContentHead(page)
</script>
