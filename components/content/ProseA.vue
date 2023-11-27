<template>
  <NuxtLink :href="href" :target="target" class="flex">
    <slot />
    <div>
      <img
        src="@/assets/images/link.svg"
        class="w-3 m-0 ml-1 mb-1.5 inline align-bottom"
      />
    </div>
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
