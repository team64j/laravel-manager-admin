<script setup>
import router from '../router'

const { params, query } = router.currentRoute.value
const { path } = params
router.replace({ path: '/' + path, query })
</script>

<template></template>
