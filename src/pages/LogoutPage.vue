<script>
import router from '@/router'
import local from '@/services/local'
import session from '@/services/session'

export default {
  name: 'LogoutPage',
  setup () {
    local.set('token', null)
    session.set(null)
    router.to('/login')

    return () => {}
  }
}
</script>
