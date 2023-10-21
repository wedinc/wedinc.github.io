<template>
  <main>
    <ContentList v-slot="{ list }" :query="query">
      <ul v-for="article in list" :key="article._path">
        <li>
          <NuxtLink :to="article._path">
            {{ article.title }}
          </NuxtLink>
        </li>
      </ul>
    </ContentList>
  </main>
</template>

<script setup lang="ts">
import type { QueryBuilderParams } from '@nuxt/content/dist/runtime/types'
const query: QueryBuilderParams = { sort: [{ date: -1 }] }
</script>
