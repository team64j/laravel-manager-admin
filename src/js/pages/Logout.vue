<script setup>
import store from '../store'

store.dispatch('set', { ['Storage.token']: null })
store.dispatch('GlobalTabs/destroy')
location.reload()
</script>

<template></template>
