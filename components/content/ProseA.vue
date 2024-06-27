<template>
  <NuxtLink :href="href" :target="target">
    <slot />
    <img
      src="@/assets/images/link.svg"
      alt="External link icon"
      class="w-3 m-0 ml-1 mb-1 inline align-bottom"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
  defineProps({
    href: {
      type: String,
      default: ''
    },
    target: {
      type: String,
      default: '_blank',
      required: false
    }
  })
</script>
