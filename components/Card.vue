<template>
  <NuxtLink
    class="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    :to="props.path"
  >
    <img
      class="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-l-lg"
      :src="props.image ? `content/${props.image}` : 'wed-logo.png'"
      :alt="props.title"
    />
    <div class="flex flex-col justify-between p-4 leading-normal">
      <h5
        class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {{ props.title }}
      </h5>
      <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
        {{ props.description }}
      </p>
      <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
        {{ props.date }}
      </p>
      <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
        {{ props.author }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
  const props = defineProps({
    title: String,
    description: String,
    date: String,
    author: String,
    image: String,
    path: String
  })
</script>
