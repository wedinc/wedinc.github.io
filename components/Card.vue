<template>
  <NuxtLink
    class="flex flex-col h-auto md:px-10 px-6 py-6 rounded-2xl hover:bg-stone-200 md:border-2 border border-stone-500 hover:border-stone-700"
    :to="props.path"
  >
    <div>
      <p class="text-sm font-medium text-stone-500">
        <time :datetime="$dayjs(props.date).format('YYYY-MM-DD')">{{
          $dayjs(props.date).format('LL')
        }}</time>
      </p>
      <h5
        class="md:mt-2 md:mb-4 mb-3 my-2 md:text-2xl text-lg font-semibold tracking-tight text-stone-700 font-manrope"
      >
        {{ props.title }}
      </h5>
    </div>
    <div class="flex flex-col md:flex-row">
      <img
        class="md:w-1/5 md:mb-0 mb-4 object-contain md:aspect-video aspect-auto"
        :src="
          props.image
            ? `${props.image.startsWith('/') ? '' : '/'}thumbnails/${
                props.image
              }`
            : '/thumbnails/dummy-image.jpg'
        "
        :alt="props.title"
      />
      <div class="md:pl-8">
        <p class="mb-3 text-base font-normal text-stone-700 line-clamp-3">
          {{ props.description }}
        </p>
        <p class="text-sm font-normal text-stone-600">
          {{ props.author }}
        </p>
      </div>
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
