import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to) => {
  // ป้องกัน loop ใต้ base เช่น /ai_gateway/
  const base = (useRuntimeConfig().public as any).basePath || '/'
  // แก้เคสที่ path ถูกเติม base ซ้ำ เช่น /ai_gateway/ai_gateway/...
  if (base && base !== '/') {
    const doublePrefix = base + base.slice(1)
    let fixedPath = to.path
    while (fixedPath.startsWith(doublePrefix)) {
      fixedPath = '/' + fixedPath.slice(base.length)
    }
    if (fixedPath !== to.path) {
      // เปลี่ยน URL ให้ถูกต้องแบบไม่เพิ่ม history ซ้ำ
      // ใช้ path แบบไม่รวม base เพื่อให้ router เติม base ให้พอดี
      const normalized = (base && base !== '/' && fixedPath.startsWith(base))
        ? '/' + fixedPath.slice(base.length)
        : fixedPath
      return navigateTo(normalized, { replace: true })
    }
  }
  const normalize = (p: string) => {
    if (base && base !== '/' && p.startsWith(base)) return '/' + p.slice(base.length)
    return p
  }
  const path = normalize(to.path)
  // ใช้ path ไม่รวม base เพื่อให้ Nuxt router เติม base ให้อัตโนมัติ
  const loginPath = '/login'

  // หน้า public (ไม่ตรวจล็อกอิน)
  const publicPages = new Set<string>([
    '/', '/about', '/callback', '/login', '/docs', '/models', '/api-playground'
  ])
  if (publicPages.has(path)) return

  try {
    const apiBase = (useRuntimeConfig().public.apiBase as string)
    const me: any = await $fetch(`${apiBase}/api/me`, { credentials: 'include' })
    if (!me || !me.user) {
      // อยู่ที่หน้า root ให้เข้าได้, ที่อื่นให้ไปหน้า login ภายใต้ base
      if (path !== '/') return navigateTo(loginPath)
    }
  } catch {
    // เรียก API ไม่ได้ → ส่งไปหน้า login (ยกเว้น root เพื่อกัน loop ที่มาเอง)
    if (path !== '/') return navigateTo(loginPath)
  }
})


