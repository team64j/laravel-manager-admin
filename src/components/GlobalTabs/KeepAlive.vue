<script>
import {
  callWithAsyncErrorHandling,
  cloneVNode,
  getCurrentInstance,
  isVNode,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  queuePostFlushCb,
  setTransitionHooks,
  warn,
  watch
} from 'vue'
import { invokeArrayFns, isArray, isString } from '@vue/shared'

let devtools

const queuePostRenderEffect = queueEffectWithSuspense
const isSuspense = (type) => type.__isSuspense
const isProdDevTools = typeof global !== 'undefined' && global.__VUE_PROD_DEVTOOLS__ || null

function queueEffectWithSuspense (fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray(fn)) {
      suspense.effects.push(...fn)
    } else {
      suspense.effects.push(fn)
    }
  } else {
    queuePostFlushCb(fn)
  }
}

function matches (pattern, name) {
  if (isArray(pattern)) {
    return pattern.some((p) => matches(p, name))
  } else if (isString(pattern)) {
    return pattern.split(',').includes(name)
  } else if (pattern?.test) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function resetShapeFlag (vnode) {
  let shapeFlag = vnode.shapeFlag
  if (shapeFlag & 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */) {
    shapeFlag -= 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */
  }
  if (shapeFlag & 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */) {
    shapeFlag -= 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */
  }
  vnode.shapeFlag = shapeFlag
}

function getInnerChild (vnode) {
  return vnode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */ ? vnode.ssContent : vnode
}

function invokeVNodeHook (hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7 /* ErrorCodes.VNODE_HOOK */, [
    vnode,
    prevVNode
  ])
}

function invalidateMount (hooks) {
  if (hooks) {
    for (let i = 0; i < hooks.length; i++)
      hooks[i].flags |= 8
  }
}

export default {
  name: 'KeepAliveComponent',
  // Marker for special handling inside the renderer. We are not using a ===
  // check directly on KeepAlive in the renderer, because importing it directly
  // would prevent it from being tree-shaken.
  __isKeepAlive: true,
  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number]
  },
  setup (props, { slots }) {
    const instance = getCurrentInstance()
    // KeepAlive communicates with the instantiated renderer via the
    // ctx where the renderer passes in its internals,
    // and the KeepAlive instance exposes activate/deactivate implementations.
    // The whole point of this is to avoid importing KeepAlive directly in the
    // renderer to facilitate tree-shaking.
    const sharedContext = instance.ctx
    // if the internal renderer is not registered, it indicates that this is server-side rendering,
    // for KeepAlive, we just need to render its children
    if (!sharedContext.renderer) {
      return () => {
        const children = slots.default && slots.default()
        return children && children.length === 1 ? children[0] : children
      }
    }
    const cache = new Map()
    const keys = new Set()
    instance.__current = null
    if ((process.env.NODE_ENV !== 'production') || isProdDevTools) {
      instance.__v_cache = cache
    }
    const parentSuspense = instance.suspense
    const { renderer: { p: patch, m: move, um: _unmount, o: { createElement } } } = sharedContext
    const storageContainer = createElement('div')
    sharedContext.activate = (vnode, container, anchor, namespace, optimized) => {
      const instance2 = vnode.component
      move(vnode, container, anchor, 0, parentSuspense)
      patch(
          instance2.vnode,
          vnode,
          container,
          anchor,
          instance2,
          parentSuspense,
          namespace,
          vnode.slotScopeIds,
          optimized
      )
      queuePostRenderEffect(() => {
        instance2.isDeactivated = false
        if (instance2.a) {
          invokeArrayFns(instance2.a)
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeMounted
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance2.parent, vnode)
        }
      }, parentSuspense)
    }
    sharedContext.deactivate = (vnode) => {
      const cached = cache.get(vnode.key)
      if (!cached || cached.component !== vnode.component) {
        return false
      }
      const instance2 = vnode.component
      invalidateMount(instance2.m)
      invalidateMount(instance2.a)
      move(vnode, storageContainer, null, 1, parentSuspense)
      queuePostRenderEffect(() => {
        if (instance2.da) {
          invokeArrayFns(instance2.da)
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance2.parent, vnode)
        }
        instance2.isDeactivated = true
      }, parentSuspense)
      {
        instance2.__keepAliveStorageContainer = storageContainer
      }
      return true
    }

    function unmount (vnode) {
      // reset the shapeFlag so it can be properly unmounted
      resetShapeFlag(vnode)
      _unmount(vnode, instance, parentSuspense, true)
    }

    function pruneCache (filter) {
      for (const key of cache.keys()) {
        if (!filter(key)) pruneCacheEntry(key)
      }
    }

    function pruneCacheEntry (key) {
      const cached = cache.get(key)
      if (!instance.__current || cached.key !== instance.__current.key || cached.type !== instance.__current.type) {
        unmount(cached)
      } else if (instance.__current) {
        // current active instance should no longer be kept-alive.
        // we can't unmount it now but it might be later, so reset its flag now.
        resetShapeFlag(instance.__current)
      }
      cache.delete(key)
      keys.delete(key)
    }

    // prune cache on include/exclude prop change
    watch(() => [props.include, props.exclude], ([include, exclude]) => {
          include && pruneCache(name => matches(include, name))
          exclude && pruneCache(name => !matches(exclude, name))
        },
        // prune post-render after `current` has been updated
        { flush: 'post', deep: true })
    // cache sub tree after render
    let pendingCacheKey = null
    const cacheSubtree = () => {
      // fix #1621, the pendingCacheKey could be 0
      if (pendingCacheKey != null) {
        cache.set(pendingCacheKey, getInnerChild(instance.subTree))
      }
    }
    onMounted(cacheSubtree)
    onUpdated(cacheSubtree)
    onBeforeUnmount(() => {
      cache.forEach(cached => {
        const { subTree, suspense } = instance
        const vnode = getInnerChild(subTree)
        if (cached.type === vnode.type && cached.key === vnode.key) {
          // current instance will be unmounted as part of keep-alive's unmount
          resetShapeFlag(vnode)
          // but invoke its deactivated hook here
          const da = vnode.component.da
          da && queuePostRenderEffect(da, suspense)
          return
        }
        unmount(cached)
      })
    })
    return () => {
      pendingCacheKey = null
      if (!slots.default) {
        return null
      }
      const children = slots.default()
      const rawVNode = children[0]
      if (children.length > 1) {
        if ((process.env.NODE_ENV !== 'production')) {
          warn(`KeepAlive should contain exactly one component child.`)
        }
        instance.__current = null
        return children
      } else if (!isVNode(rawVNode) ||
          (!(rawVNode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) &&
              !(rawVNode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */))) {
        instance.__current = null
        return rawVNode
      }
      let vnode = getInnerChild(rawVNode)
      const comp = vnode.type
      // for async components, name check should be based in its loaded
      // inner component if available
      const key = vnode.key
      const { include, exclude, max } = props

      if (
          key == null ||
          (include && !matches(include, key)) ||
          (exclude && matches(exclude, key))
      ) {
        resetShapeFlag(vnode)
        instance.__current = vnode
        return rawVNode
      }

      const cachedVNode = cache.get(key)
      // clone vnode if it's reused because we are going to mutate it
      if (vnode.el) {
        vnode = cloneVNode(vnode)
        if (rawVNode.shapeFlag & 128 /* ShapeFlags.SUSPENSE */) {
          rawVNode.ssContent = vnode
        }
      }
      // #1513 it's possible for the returned vnode to be cloned due to attr
      // fallthrough or scopeId, so the vnode here may not be the final vnode
      // that is mounted. Instead of caching it directly, we store the pending
      // key and cache `instance.subTree` (the normalized vnode) in
      // beforeMount/beforeUpdate hooks.
      pendingCacheKey = key
      if (cachedVNode) {
        // copy over mounted state
        vnode.el = cachedVNode.el
        vnode.component = cachedVNode.component
        if (vnode.transition) {
          // recursively update transition hooks on subTree
          setTransitionHooks(vnode, vnode.transition)
        }
        // avoid vnode being mounted as fresh
        vnode.shapeFlag |= 512 /* ShapeFlags.COMPONENT_KEPT_ALIVE */
        // make this key the freshest
        keys.delete(key)
        keys.add(key)
      } else {
        keys.add(key)
        // prune oldest entry
        if (max && keys.size > parseInt(max, 10)) {
          pruneCacheEntry(keys.values().next().value)
        }
      }
      // avoid vnode being unmounted
      vnode.shapeFlag |= 256 /* ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE */
      instance.__current = vnode
      return isSuspense(rawVNode.type) ? rawVNode : vnode
    }
  }
}
</script>
