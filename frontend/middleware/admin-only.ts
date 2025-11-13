import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to, from) => {
  try {
    const apiBase = (useRuntimeConfig().public.apiBase as string)
    const me = await $fetch(`${apiBase}/api/me`, { credentials: 'include' }) as any
    
    if (!me?.user) {
      return navigateTo('/login')
    }
    
    const role = (me.user.role || '').toLowerCase()
    if (!['admin'].includes(role)) {
      return navigateTo('/')
    }
  } catch (error) {
    console.error('Admin middleware error:', error)
    return navigateTo('/login')
  }
})


