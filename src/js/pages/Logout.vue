<script setup>
import store from '../store'

store.dispatch('set', { ['Storage.token']: null })
store.dispatch('GlobalTabs/destroy')
store.dispatch('Session/clear')
location.reload()
</script>

<template></template>
