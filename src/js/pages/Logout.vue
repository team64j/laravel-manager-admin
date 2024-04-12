<script>
import store from '../store'
import router from '../router'

export default {
  setup () {
    store.dispatch('set', { ['Storage.token']: null }).then(() => {
      store.dispatch('Session/clear').then(() => {
        router.to('/login')
      })
    })

    return () => {}
  }
}
</script>
