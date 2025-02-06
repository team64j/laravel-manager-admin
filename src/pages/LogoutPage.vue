<script>
import store from '@/store'
import router from '@/router'

export default {
  name: 'LogoutPage',
  setup () {
    store.dispatch('set', { ['Storage.token']: null }).then(() => {
      store.dispatch('Session/clear').then(() => {
        router.to('/auth/login')
      })
    })

    return () => {}
  }
}
</script>
