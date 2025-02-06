<script>
import router from '@/router'

export default {
  name: 'RedirectPage',
  setup () {
    const { params, query } = router.currentRoute.value
    const { path } = params
    router.replace({ path: '/' + path, query })

    return () => {}
  }
}
</script>
