<template>
  <main>
    <ContentList v-slot="{ list }" :query="query">
      <ul>
        <li v-for="article in list" :key="article._path" class="mb-8">
          <Card
            :title="article.title"
            :description="article.description"
            :date="article.date"
            :author="article.author"
            :image="article.image"
            :path="article._path"
          />
        </li>
      </ul>
    </ContentList>
  </main>
</template>

<script setup lang="ts">
  import type { QueryBuilderParams } from '@nuxt/content/dist/runtime/types'
  const query: QueryBuilderParams = {
    sort: [{ date: -1 }],
    where: { _path: { $ne: '/' } }
  }
</script>
