<script setup>
import store from '../store'
import router from '../router'

store.dispatch('set', { ['Storage.token']: null }).then(() => {
  store.dispatch('GlobalTabs/destroy').then(() => {
    store.dispatch('Session/clear').then(() => {
      router.push({ name: 'Login' })
    })
  })
})
</script>

<template/>
