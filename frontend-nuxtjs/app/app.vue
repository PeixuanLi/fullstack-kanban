<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'Kanban Board',
  description: 'A fullstack Kanban board application'
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
