<template>
  <main>
    <article class="prose max-w-full md:px-20 px-6 text-base text-stone-800">
      <ContentRenderer v-if="data" :value="data" tag="article">
        <header class="md:mb-16 mb-8">
          <time
            class="text-base font-medium text-stone-500"
            :datetime="$dayjs(data.date).format('YYYY-MM-DD')"
            >{{ $dayjs(data.date).format('LL') }}</time
          >
          <h1
            class="md:mt-6 mt-2 mb-0 font-manrope md:text-3xl text-xl text-stone-700"
          >
            {{ data.title }}
          </h1>
          <address class="author text-base mt-4 font-medium text-stone-600">
            {{ data.author }}
          </address>
        </header>
        <ContentRendererMarkdown :value="data" />
      </ContentRenderer>
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
