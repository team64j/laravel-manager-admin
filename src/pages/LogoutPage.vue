<script>
import store from '@/store'
import router from '@/router'
import local from '@/services/local'

export default {
  name: 'LogoutPage',
  setup () {
    local.set('token', null)
    store.dispatch('Session/clear').then(() => {
      router.to('/login')
    })

    return () => {}
  },
}
</script>
