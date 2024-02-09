<template>
  <code class="prose-code relative">
    <slot />
    <img
      src="@/assets/images/copy.svg"
      alt="Copy to clipboard"
      class="copy-btn absolute w-7 top-2 right-2 bg-gray-600 hover:bg-gray-500 rounded-xl p-0.5 box-content transition-colors cursor-pointer m-0"
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
    copy(props.code.slice(0, -1))
  }
</script>
