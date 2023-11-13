<template>
  <code
    class="text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-900 text-white rounded-lg p-4 pl-6 relative w-full"
  >
    <slot />
    <img
      src="@/assets/images/copy.svg"
      class="absolute w-7 top-2 right-2 bg-gray-600 hover:bg-gray-500 rounded-xl p-1 box-content transition-colors cursor-pointer"
      @click="onClick"
    />
  </code>
</template>

<script setup lang="ts">
  import { useClipboard } from '@vueuse/core'

  const props = defineProps({
    code: {
      type: String,
      default: ''
    }
  })

  const { copy } = useClipboard()

  const onClick = () => {
    copy(props.code)
  }
</script>

<style scoped>
  code::before,
  code::after {
    content: none;
  }
</style>
