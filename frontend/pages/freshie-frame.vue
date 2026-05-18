<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch, nextTick } from 'vue'
import { useHead, useRuntimeConfig, useRoute } from 'nuxt/app'

/** ขนาดรูปที่ส่ง n8n (สี่เหลี่ยมจัตุรัส ให้สเกลตามพรีวิว) */
const FRESHIE_EXPORT_PX = 1080
/** ถ้ารูปต้นฉบับยาวเกินค่านี้ จะบีบก่อนแสดง/ส่ง — ยังเพียงพอสำหรับเฟรม 1080px และลดน้ำหนักหน่วยความจำ */
const FRESHIE_SOURCE_LONG_EDGE_MAX = 3200
/** โหมด AI: บีบก่อนส่ง n8n (nginx มักจำกัด ~1MB รวม base64 ใน JSON) */
const FRESHIE_ANIME_LONG_EDGE_MAX = 768
const FRESHIE_ANIME_MAX_BYTES = 400 * 1024

/** Default zoom after upload / reset (< 1 = smaller than “cover”, shows handles so users notice they can adjust) */
const PHOTO_ZOOM_DEFAULT = 0.26
/** Minimum zoom multiplier */
const PHOTO_ZOOM_MIN = 0.22
const PHOTO_ZOOM_MAX = 4

function clampPhotoZoom(z: number) {
  return Math.min(PHOTO_ZOOM_MAX, Math.max(PHOTO_ZOOM_MIN, z))
}

/** Axis-aligned size of a w×h rectangle rotated by `deg` (any angle, degrees). */
function rotatedAabbSize(w: number, h: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  const c = Math.abs(Math.cos(rad))
  const s = Math.abs(Math.sin(rad))
  return { w: w * c + h * s, h: w * s + h * c }
}

type Theme = {
  id: string
  previewFile: string
  title: string
  /** เฟรมที่มีช่องข้อความ — ประกอบรูป+ข้อความบนเบราว์เซอร์ก่อนส่ง API */
  textFrame?: boolean
}

/** ตำแหน่งกล่องข้อความบนเฟรม UBU69_TEXT1 (สัดส่วนของความกว้าง/สูง 1080px) */
/** ปรับตำแหน่งกล่องข้อความ/ขอบรอยปะ: ลด top = เลื่อนขึ้น, เพิ่ม top = เลื่อนลง */
const TEXT_FRAME_BOX = {
  left: 0.05,
  top: 0.77,
  width: 0.9,
  height: 0.16
} as const
/** ค่าเริ่มต้นเลื่อนขึ้น — ช่องขาวบนเฟรมสูงกว่าจุดกึ่งกลางทางตาเล็กน้อย */
const TEXT_FRAME_OFFSET_Y_DEFAULT = 0
/** ชดเชยฟอนต์ไทยที่วาดต่ำกว่ากึ่งกลางทางคณิตศาสตร์ */
const TEXT_FRAME_OPTICAL_BIAS = -0.05
const FRESHIE_FRAME_TEXT_MAX = 48
const TEXT_FRAME_FONT_BASE_PX = 72
const TEXT_FRAME_FONT_SCALE_MIN = 0.55
const TEXT_FRAME_FONT_SCALE_MAX = 1.65
const TEXT_FRAME_FONT_SCALE_STEP = 0.08
const TEXT_FRAME_PLACEHOLDER = 'เด็กม.อุบล'
const TEXT_FRAME_OFFSET_Y_MIN = -0.38
const TEXT_FRAME_OFFSET_Y_MAX = 0.38
const TEXT_FRAME_OFFSET_Y_STEP = 0.025

const themes: Theme[] = [
  { id: '1', previewFile: 'UBU1.png', title: 'Street Dark' },
  { id: '2', previewFile: 'UBU2.png', title: 'Scrapbook' },
  { id: '3', previewFile: 'UBU3.png', title: 'Pop Blue' },
  { id: '4', previewFile: 'UBU4.png', title: 'Pink Y2K' },
  { id: '9', previewFile: 'UBU9.png', title: 'Scrapbook Purple' },
  { id: '10', previewFile: 'UBU10.png', title: 'Cyber Grid' },
  { id: '11', previewFile: 'UBU11.png', title: 'Brush Welcome' },
  { id: '12', previewFile: 'UBU12.png', title: 'Pink Desktop' },
  { id: '5', previewFile: 'UBU5.png', title: 'Scrapbook II' },
  { id: '6', previewFile: 'UBU6.png', title: 'Pop Blue II' },
  { id: '7', previewFile: 'UBU7.png', title: 'Street Dark II' },
  { id: '8', previewFile: 'UBU8.png', title: 'Pink Y2K II' },
  { id: '69-text1', previewFile: 'UBU69_TEXT1.png', title: 'TEXT', textFrame: true }
]

const runtime = useRuntimeConfig()
const route = useRoute()
const apiBase = runtime.public.apiBase as string
const basePath = String((runtime.public as any).basePath || '/')
const assetPathPrefix = basePath === '/' ? '' : basePath.replace(/\/$/, '')

function themePreviewUrl(file: string) {
  return `${assetPathPrefix}/assets/freshie-frame/${file}`
}

const pageBgStyle = computed(() => ({
  '--ff-page-bg': `url('${themePreviewUrl('BGFS.png')}')`
}))

const buildApiPath = (endpoint: string) =>
  apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/${endpoint}` : `${apiBase}/api/${endpoint}`

const selectedTheme = ref<string>('1')
const frameCustomText = ref('')
/** ตัวคูณขนาดข้อความบนเฟรม TEXT (1 = ค่าเริ่มต้น) */
const frameTextFontScale = ref(1)
/** เลื่อนข้อความขึ้น/ลงในช่อง (หน่วย = สัดส่วนความสูงกล่อง) */
const frameTextOffsetY = ref(TEXT_FRAME_OFFSET_Y_DEFAULT)
const fileInput = ref<HTMLInputElement | null>(null)
const previewObjectUrl = ref<string | null>(null)
const sourceFile = ref<File | null>(null)
const stackRef = ref<HTMLElement | null>(null)
const stackPx = ref(320)
const natDims = ref({ w: 0, h: 0 })
const photoZoom = ref(PHOTO_ZOOM_DEFAULT)
const photoPanX = ref(0)
const photoPanY = ref(0)
/** Degrees, clockwise; applied in preview and export canvas. */
const photoRotationDeg = ref(0)
const draggingPhoto = ref(false)
const resizingPhoto = ref(false)
const rotatingPhoto = ref(false)
let dragStartClient = { x: 0, y: 0 }
let dragStartPan = { x: 0, y: 0 }
let resizeStartClient = { x: 0, y: 0 }
let resizeStartZoom = 1
let rotateLastPointerAngle = 0
const dragOver = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const resultUrl = ref<string | null>(null)
/** ข้อความช่วยใต้ปุ่มใน overlay ผลลัพธ์ (ดาวน์โหลด) */
const resultExtraHint = ref('')
/** แจ้งเมื่อบีบรูปต้นฉบับให้เล็กลง (คุณ�� าพยังสูงสำหรับเฟรม) */
const photoOptimizeHint = ref('')
type PhotoMode = null | 'normal' | 'ai'

/** null = เลือกวิธี, normal = อัปโหลดตรง, ai = แปลงอนิเมะ 3D (ต้อง login) */
const photoMode = ref<PhotoMode>(null)
const portalUser = ref<{ fullname?: string; username?: string } | null>(null)
const portalUserLoading = ref(true)
/** รูปต้นฉบับสำหรับโหมด AI (ก่อนแปลง) */
const uploadedOriginalFile = ref<File | null>(null)
const uploadedOriginalUrl = ref<string | null>(null)
const animeLoading = ref(false)
const animeError = ref('')
const freshieStatsTotal = ref(0)
const freshieStatsDisplay = ref(0)
const freshieStatsBump = ref(false)
let freshieStatsPollTimer: ReturnType<typeof setInterval> | null = null
let freshieStatsAnimFrame = 0
let filePickTarget: 'normal' | 'ai' = 'normal'
const dragTarget = ref<'normal' | 'ai'>('normal')

const isPortalLoggedIn = computed(() => Boolean(portalUser.value))

const activeTheme = computed(() => {
  const id = selectedTheme.value
  return themes.find((t) => t.id === id) ?? themes[0]
})

const textFrameOverlayStyle = computed(() => ({
  left: `${TEXT_FRAME_BOX.left * 100}%`,
  top: `${TEXT_FRAME_BOX.top * 100}%`,
  width: `${TEXT_FRAME_BOX.width * 100}%`,
  height: `${TEXT_FRAME_BOX.height * 100}%`
}))

const textFrameOverlayFontStyle = computed(() => {
  const S = Math.max(1, stackPx.value || stackRef.value?.offsetWidth || 320)
  const boxH = TEXT_FRAME_BOX.height * S
  const basePx = Math.min(TEXT_FRAME_FONT_BASE_PX, boxH * 0.72)
  const px = Math.max(10, Math.round(basePx * frameTextFontScale.value))
  return { fontSize: `${px}px` }
})

function frameTextOffsetEffective(userOffset = frameTextOffsetY.value) {
  return userOffset + TEXT_FRAME_OPTICAL_BIAS
}

const textFrameLabelStyle = computed(() => {
  const S = Math.max(1, stackPx.value || stackRef.value?.offsetWidth || 320)
  const offsetPx = frameTextOffsetEffective() * TEXT_FRAME_BOX.height * S
  return {
    ...textFrameOverlayFontStyle.value,
    transform: `translateY(${offsetPx}px)`
  }
})

const frameTextDisplay = computed(() => frameCustomText.value.trim() || TEXT_FRAME_PLACEHOLDER)
const frameTextIsPlaceholder = computed(() => !frameCustomText.value.trim())

const isTextTheme = computed(() => Boolean(activeTheme.value?.textFrame))

const photoFrameThemes = computed(() => themes.filter((t) => !t.textFrame))
const textFrameThemes = computed(() => themes.filter((t) => t.textFrame))

const canGenerate = computed(() => {
  if (
    !selectedTheme.value ||
    !sourceFile.value ||
    natDims.value.w <= 0 ||
    natDims.value.h <= 0 ||
    loading.value ||
    animeLoading.value
  ) {
    return false
  }
  if (isTextTheme.value && !frameCustomText.value.trim()) return false
  return true
})

/** Pan only — rotation lives on inner so the rotate knob can sit below the photo box, not below the whole frame */
const photoMoverOuterStyle = computed(() => {
  const S = Math.max(1, stackPx.value)
  const nw = natDims.value.w
  const nh = natDims.value.h
  if (!nw || !nh || !previewObjectUrl.value) {
    return { display: 'none' as const }
  }
  const cs = Math.max(S / nw, S / nh) * photoZoom.value
  const bw = nw * cs
  const bh = nh * cs
  return {
    width: `${bw}px`,
    height: `${bh}px`,
    marginLeft: `${-bw / 2}px`,
    marginTop: `${-bh / 2}px`,
    transform: `translate(${photoPanX.value}px, ${photoPanY.value}px)`
  }
})

const photoMoverInnerStyle = computed(() => ({
  transform: `rotate(${photoRotationDeg.value}deg)`
}))

function clearResult() {
  resultUrl.value = null
  resultExtraHint.value = ''
}

useHead({
  title: 'น้องใหม่ UBU · เฟรมโปรไฟล์',
  meta: [
    { name: 'description', content: 'เลือกธีม อัปโปร สร้างเฟรมรูปน้องใหม่มหาวิทยาลัยอุบลราชธานี' }
  ],
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@500;700;800&family=Prompt:wght@500;700;800&display=swap'
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap'
    }
  ]
})

function pickTheme(id: string) {
  const prev = selectedTheme.value
  const prevTheme = themes.find((t) => t.id === prev)
  const nextTheme = themes.find((t) => t.id === id)
  selectedTheme.value = id
  resultUrl.value = null
  resultExtraHint.value = ''
  errorMsg.value = ''
  if (prevTheme?.textFrame && !nextTheme?.textFrame) {
    frameCustomText.value = ''
    frameTextFontScale.value = 1
    frameTextOffsetY.value = TEXT_FRAME_OFFSET_Y_DEFAULT
  }
  if (prev !== id) resetPhotoAdjust()
  if (nextTheme?.textFrame && typeof document !== 'undefined') {
    nextTick(() => {
      document.getElementById('ff-frame-text-input')?.focus()
    })
  }
}

function clampFrameTextOffsetY(offset: number) {
  return Math.min(
    TEXT_FRAME_OFFSET_Y_MAX,
    Math.max(TEXT_FRAME_OFFSET_Y_MIN, Math.round(offset * 1000) / 1000)
  )
}

function bumpFrameTextOffsetY(delta: number) {
  frameTextOffsetY.value = clampFrameTextOffsetY(frameTextOffsetY.value + delta)
}

function onFrameTextOffsetSlider(ev: Event) {
  const raw = Number((ev.target as HTMLInputElement).value)
  if (!Number.isFinite(raw)) return
  frameTextOffsetY.value = clampFrameTextOffsetY(raw / 100)
}

function clampFrameTextFontScale(scale: number) {
  return Math.min(
    TEXT_FRAME_FONT_SCALE_MAX,
    Math.max(TEXT_FRAME_FONT_SCALE_MIN, Math.round(scale * 100) / 100)
  )
}

function bumpFrameTextFontScale(delta: number) {
  frameTextFontScale.value = clampFrameTextFontScale(frameTextFontScale.value + delta)
}

function triggerFileNormal() {
  filePickTarget = 'normal'
  fileInput.value?.click()
}

function triggerFileAi() {
  filePickTarget = 'ai'
  fileInput.value?.click()
}

async function fetchPortalUser() {
  portalUserLoading.value = true
  try {
    const me = await $fetch<{ user?: { fullname?: string; username?: string } }>(buildApiPath('me'), {
      credentials: 'include'
    })
    portalUser.value = me?.user || null
  } catch {
    portalUser.value = null
  } finally {
    portalUserLoading.value = false
  }
}

function goLoginForAi() {
  const returnPath = '/freshie-frame?photo=ai'
  if (import.meta.client) {
    sessionStorage.setItem('ff_return_after_login', returnPath)
    sessionStorage.setItem('ff_photo_mode', 'ai')
  }
  const oauthLoginPath =
    apiBase.endsWith('/api') || apiBase === '/api' ? `${apiBase}/oauth-login` : `${apiBase}/api/oauth-login`
  window.location.href = `${oauthLoginPath}?next=${encodeURIComponent(returnPath)}`
}

function onPortalLoginSuccess() {
  void fetchPortalUser().then(() => {
    const q = String(route.query.photo || '')
    if (q === 'ai' || sessionStorage.getItem('ff_photo_mode') === 'ai') {
      photoMode.value = 'ai'
      sessionStorage.removeItem('ff_photo_mode')
    }
  })
}

function clearAllPhotoState() {
  errorMsg.value = ''
  photoOptimizeHint.value = ''
  animeError.value = ''
  clearFramePhoto()
  revokeUploadedOriginalUrl()
  uploadedOriginalFile.value = null
}

function onNormalZoneClick() {
  photoMode.value = 'normal'
  animeError.value = ''
  revokeUploadedOriginalUrl()
  uploadedOriginalFile.value = null
  triggerFileNormal()
}

function onAiZoneClick() {
  if (portalUserLoading.value) return
  if (!isPortalLoggedIn.value) {
    goLoginForAi()
    return
  }
  photoMode.value = 'ai'
  animeError.value = ''
  triggerFileAi()
}

function onDragOverNormal(ev: DragEvent) {
  dragTarget.value = 'normal'
  onDragOver(ev)
}

function onDragOverAi(ev: DragEvent) {
  dragTarget.value = 'ai'
  onDragOver(ev)
}

function onDropNormal(ev: DragEvent) {
  dragTarget.value = 'normal'
  onDrop(ev)
}

function onDropAi(ev: DragEvent) {
  dragTarget.value = 'ai'
  onDrop(ev)
}

function measureStack() {
  const el = stackRef.value
  if (el && el.offsetWidth > 0) stackPx.value = el.offsetWidth
}

function resetPhotoAdjust() {
  photoZoom.value = PHOTO_ZOOM_DEFAULT
  photoPanX.value = 0
  photoPanY.value = 0
  photoRotationDeg.value = 0
  nextTick(() => clampPhotoPan())
}

function clampPhotoPan() {
  const S = Math.max(1, stackPx.value)
  const nw = natDims.value.w
  const nh = natDims.value.h
  if (!nw || !nh) return
  const cs = Math.max(S / nw, S / nh) * photoZoom.value
  const bw = nw * cs
  const bh = nh * cs
  const { w: aabbW, h: aabbH } = rotatedAabbSize(bw, bh, photoRotationDeg.value)
  const maxX = Math.abs(aabbW / 2 - S / 2)
  const maxY = Math.abs(aabbH / 2 - S / 2)
  photoPanX.value = Math.min(maxX, Math.max(-maxX, photoPanX.value))
  photoPanY.value = Math.min(maxY, Math.max(-maxY, photoPanY.value))
}

function onPhotoLoad(ev: Event) {
  const img = ev.target as HTMLImageElement
  const w = img.naturalWidth || 0
  const h = img.naturalHeight || 0
  if (w && h && (w !== natDims.value.w || h !== natDims.value.h)) {
    natDims.value = { w, h }
  }
  nextTick(() => {
    measureStack()
    clampPhotoPan()
  })
}

function onPhotoError() {
  errorMsg.value = 'Could not open image. Try JPG or PNG.'
  sourceFile.value = null
  natDims.value = { w: 0, h: 0 }
  photoOptimizeHint.value = ''
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
    previewObjectUrl.value = null
  }
}

function bumpPhotoZoom(delta: number) {
  if (!previewObjectUrl.value || !natDims.value.w) return
  photoZoom.value = clampPhotoZoom(photoZoom.value + delta)
  clampPhotoPan()
}

function bumpPhotoRotation(deltaDeg: number) {
  if (!previewObjectUrl.value || !natDims.value.w) return
  photoRotationDeg.value += deltaDeg
  clampPhotoPan()
}

function rotatePhoto90(dir: 1 | -1) {
  bumpPhotoRotation(dir * 90)
}

function onStackWheel(e: WheelEvent) {
  if (!previewObjectUrl.value || !natDims.value.w) return
  e.preventDefault()
  const factor = e.deltaY > 0 ? 0.96 : 1.04
  photoZoom.value = clampPhotoZoom(photoZoom.value * factor)
  clampPhotoPan()
}

function stackCenterClient() {
  const el = stackRef.value
  if (!el) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function onPhotoPointerDown(e: PointerEvent) {
  if (!previewObjectUrl.value || !natDims.value.w || resizingPhoto.value || rotatingPhoto.value) return
  const t = e.target as HTMLElement
  if (t.closest('.ff-photo-hud__handle') || t.closest('.ff-photo-mover-rotate')) return
  e.preventDefault()
  draggingPhoto.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragStartClient = { x: e.clientX, y: e.clientY }
  dragStartPan = { x: photoPanX.value, y: photoPanY.value }
}

function onPhotoPointerMove(e: PointerEvent) {
  if (!draggingPhoto.value || resizingPhoto.value || rotatingPhoto.value) return
  photoPanX.value = dragStartPan.x + (e.clientX - dragStartClient.x)
  photoPanY.value = dragStartPan.y + (e.clientY - dragStartClient.y)
}

function onResizeHandleDown(e: PointerEvent) {
  if (!previewObjectUrl.value || !natDims.value.w || rotatingPhoto.value) return
  e.stopPropagation()
  e.preventDefault()
  resizingPhoto.value = true
  resizeStartClient = { x: e.clientX, y: e.clientY }
  resizeStartZoom = photoZoom.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onResizeHandleMove(e: PointerEvent) {
  if (!resizingPhoto.value) return
  const dx = e.clientX - resizeStartClient.x
  const dy = e.clientY - resizeStartClient.y
  const span = Math.max(96, stackPx.value)
  const t = (dx + dy) / span
  photoZoom.value = clampPhotoZoom(resizeStartZoom * (1 + t * 1.35))
  clampPhotoPan()
}

function onResizeHandleUp(e: PointerEvent) {
  if (!resizingPhoto.value) return
  resizingPhoto.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* already released */
  }
  clampPhotoPan()
}

function onRotateHandleDown(e: PointerEvent) {
  if (!previewObjectUrl.value || !natDims.value.w || resizingPhoto.value) return
  e.stopPropagation()
  e.preventDefault()
  rotatingPhoto.value = true
  const c = stackCenterClient()
  rotateLastPointerAngle = Math.atan2(e.clientY - c.y, e.clientX - c.x)
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onRotateHandleMove(e: PointerEvent) {
  if (!rotatingPhoto.value) return
  const c = stackCenterClient()
  const ang = Math.atan2(e.clientY - c.y, e.clientX - c.x)
  let d = ang - rotateLastPointerAngle
  if (d > Math.PI) d -= 2 * Math.PI
  if (d < -Math.PI) d += 2 * Math.PI
  photoRotationDeg.value += (d * 180) / Math.PI
  rotateLastPointerAngle = ang
  clampPhotoPan()
}

function onRotateHandleUp(e: PointerEvent) {
  if (!rotatingPhoto.value) return
  rotatingPhoto.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* already released */
  }
  clampPhotoPan()
}

function onPhotoPointerUp(e: PointerEvent) {
  const t = e.currentTarget as HTMLElement
  if (!draggingPhoto.value) return
  draggingPhoto.value = false
  try {
    t.releasePointerCapture(e.pointerId)
  } catch {
    /* already released */
  }
  clampPhotoPan()
}

/**
 * ถ้ารูปใหญ่เกินไป บีบให้ขอบยาว ≤ FRESHIE_SOURCE_LONG_EDGE_MAX ด้วย canvas (high-quality smoothing)
 * เพียงพอสำหรับเฟรม 1080px และลด RAM / ความเสี่ยงบนมือถือ
 */
async function downscaleImageFileIfNeeded(
  file: File,
  w: number,
  h: number
): Promise<{ file: File; w: number; h: number; downscaled: boolean }> {
  const long = Math.max(w, h)
  if (long <= FRESHIE_SOURCE_LONG_EDGE_MAX) {
    return { file, w, h, downscaled: false }
  }
  const scale = FRESHIE_SOURCE_LONG_EDGE_MAX / long
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))
  const bmp = await createImageBitmap(file).catch(() => null)
  if (!bmp) {
    return { file, w, h, downscaled: false }
  }
  try {
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { file, w, h, downscaled: false }
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, tw, th)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95)
    })
    if (!blob) {
      return { file, w, h, downscaled: false }
    }
    const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
    const next = new File([blob], `${base}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
    return { file: next, w: tw, h: th, downscaled: true }
  } finally {
    bmp.close()
  }
}

/** บีบรูปสำหรับส่งแปลงอนิเมะ — ลด token / ค่าใช้จ่าย */
async function compressFileForAnimeUpload(
  file: File,
  w: number,
  h: number
): Promise<{ file: File; w: number; h: number; compressed: boolean }> {
  const long = Math.max(w, h)
  const scale =
    long > FRESHIE_ANIME_LONG_EDGE_MAX ? FRESHIE_ANIME_LONG_EDGE_MAX / long : 1
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))
  const isJpeg = /^image\/jpe?g$/i.test(file.type)
  if (
    scale >= 1 &&
    isJpeg &&
    file.size <= FRESHIE_ANIME_MAX_BYTES
  ) {
    return { file, w, h, compressed: false }
  }

  const bmp = await createImageBitmap(file).catch(() => null)
  if (!bmp) return { file, w, h, compressed: false }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) return { file, w, h, compressed: false }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, tw, th)

    const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
    const qualities = [0.85, 0.75, 0.65, 0.55, 0.45]
    let best: File | null = null
    for (const q of qualities) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', q)
      })
      if (!blob) continue
      const next = new File([blob], `${base}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })
      best = next
      if (blob.size <= FRESHIE_ANIME_MAX_BYTES) break
    }
    if (!best) return { file, w, h, compressed: false }
    return { file: best, w: tw, h: th, compressed: true }
  } finally {
    bmp.close()
  }
}

async function composeAdjustedPhotoForApi(): Promise<{
  name: string
  mimeType: string
  contentBase64: string
  size: number
}> {
  const file = sourceFile.value
  const nw = natDims.value.w
  const nh = natDims.value.h
  if (!file || !nw || !nh) {
    throw new Error('No image loaded yet')
  }
  const E = FRESHIE_EXPORT_PX
  const S = Math.max(1, stackPx.value || stackRef.value?.offsetWidth || 320)
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    throw new Error('Could not open image')
  }
  try {
    const scaleE = Math.max(E / nw, E / nh) * photoZoom.value
    const dw = nw * scaleE
    const dh = nh * scaleE
    const panEX = (photoPanX.value * E) / S
    const panEY = (photoPanY.value * E) / S
    const canvas = document.createElement('canvas')
    canvas.width = E
    canvas.height = E
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, E, E)
    ctx.save()
    ctx.translate(E / 2 + panEX, E / 2 + panEY)
    ctx.rotate((photoRotationDeg.value * Math.PI) / 180)
    ctx.drawImage(bitmap, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()
    const mimeType = 'image/jpeg'
    const dataUrl = canvas.toDataURL(mimeType, 0.92)
    const contentBase64 = dataUrl.split(',')[1] || ''
    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '')
    return {
      name: `${baseName}.jpg`,
      mimeType,
      contentBase64,
      size: Math.round((contentBase64.length * 3) / 4)
    }
  } finally {
    bitmap.close()
  }
}

async function ensureFrameTextFonts() {
  if (typeof document === 'undefined') return
  try {
    await Promise.all([
      document.fonts.load('800 72px Kanit'),
      document.fonts.load('700 72px Prompt')
    ])
    await document.fonts.ready
  } catch {
    /* ใช้ fallback ของระบบถ้าโหลดฟอนต์ไม่สำเร็จ */
  }
}

function drawFrameCaptionText(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasSize: number,
  fontScale = 1,
  offsetYFrac = 0
) {
  const bx = TEXT_FRAME_BOX.left * canvasSize
  const by = TEXT_FRAME_BOX.top * canvasSize
  const bw = TEXT_FRAME_BOX.width * canvasSize
  const bh = TEXT_FRAME_BOX.height * canvasSize
  const cx = bx + bw / 2
  const cy = by + bh / 2 + frameTextOffsetEffective(offsetYFrac) * bh
  const maxW = bw * 0.9
  const minFs = 22
  const baseCap = Math.min(TEXT_FRAME_FONT_BASE_PX, Math.floor(bh * 0.72))
  let fontSize = Math.round(baseCap * fontScale)
  ctx.fillStyle = '#111827'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  while (fontSize >= minFs) {
    ctx.font = `800 ${fontSize}px Kanit, Prompt, sans-serif`
    if (ctx.measureText(text).width <= maxW) break
    fontSize -= 2
  }
  ctx.font = `800 ${Math.max(minFs, fontSize)}px Kanit, Prompt, sans-serif`
  ctx.fillText(text, cx, cy)
}

function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load frame image'))
    img.src = url
  })
}

async function composeFullTextFrameForApi(): Promise<{
  name: string
  mimeType: string
  contentBase64: string
  size: number
}> {
  const file = sourceFile.value
  const nw = natDims.value.w
  const nh = natDims.value.h
  const caption = frameCustomText.value.trim()
  if (!file || !nw || !nh) throw new Error('No image loaded yet')
  if (!caption) throw new Error('กรุณาใส่ข้อความบนเฟรม')

  const E = FRESHIE_EXPORT_PX
  const S = Math.max(1, stackPx.value || stackRef.value?.offsetWidth || 320)
  const frameUrl = themePreviewUrl(activeTheme.value.previewFile)
  const [photoBitmap, frameEl] = await Promise.all([
    createImageBitmap(file).catch(() => null),
    loadImageElement(frameUrl)
  ])
  if (!photoBitmap) throw new Error('Could not open image')

  await ensureFrameTextFonts()

  try {
    const scaleE = Math.max(E / nw, E / nh) * photoZoom.value
    const dw = nw * scaleE
    const dh = nh * scaleE
    const panEX = (photoPanX.value * E) / S
    const panEY = (photoPanY.value * E) / S
    const canvas = document.createElement('canvas')
    canvas.width = E
    canvas.height = E
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, E, E)
    ctx.save()
    ctx.translate(E / 2 + panEX, E / 2 + panEY)
    ctx.rotate((photoRotationDeg.value * Math.PI) / 180)
    ctx.drawImage(photoBitmap, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()
    ctx.drawImage(frameEl, 0, 0, E, E)
    drawFrameCaptionText(ctx, caption, E, frameTextFontScale.value, frameTextOffsetY.value)
    const mimeType = 'image/jpeg'
    const dataUrl = canvas.toDataURL(mimeType, 0.92)
    const contentBase64 = dataUrl.split(',')[1] || ''
    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '')
    return {
      name: `${baseName}-text-frame.jpg`,
      mimeType,
      contentBase64,
      size: Math.round((contentBase64.length * 3) / 4)
    }
  } finally {
    photoBitmap.close()
  }
}

function revokeUploadedOriginalUrl() {
  if (uploadedOriginalUrl.value) {
    URL.revokeObjectURL(uploadedOriginalUrl.value)
    uploadedOriginalUrl.value = null
  }
}

function clearFramePhoto() {
  sourceFile.value = null
  natDims.value = { w: 0, h: 0 }
  photoZoom.value = PHOTO_ZOOM_DEFAULT
  photoPanX.value = 0
  photoPanY.value = 0
  photoRotationDeg.value = 0
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
    previewObjectUrl.value = null
  }
}

async function fileToUploadPayload(file: File) {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  const contentBase64 = btoa(binary)
  return {
    name: file.name,
    mimeType: file.type || 'image/jpeg',
    contentBase64,
    size: file.size
  }
}

async function applyFramePhoto(file: File, w: number, h: number, downscaled: boolean) {
  clearFramePhoto()
  sourceFile.value = file
  photoOptimizeHint.value = downscaled
    ? `รูปต้นฉบับใหญ่มาก — บีบให้ขอบยาวสุดไม่เกิน ${FRESHIE_SOURCE_LONG_EDGE_MAX}px แล้ว (ยังคมชัดพอสำหรับเฟรม)`
    : ''
  previewObjectUrl.value = URL.createObjectURL(file)
  natDims.value = { w, h }
  animeError.value = ''
  resetPhotoAdjust()
  nextTick(() => {
    measureStack()
    clampPhotoPan()
  })
}

async function blobToFrameFile(blob: Blob, mimeType: string) {
  const type = mimeType || blob.type || 'image/jpeg'
  const ext = type.includes('png') ? 'png' : 'jpg'
  const file = new File([blob], `freshie-anime-3d.${ext}`, { type, lastModified: Date.now() })
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error('Could not open generated image')
  const w = bitmap.width
  const h = bitmap.height
  bitmap.close()
  const work = await downscaleImageFileIfNeeded(file, w, h)
  await applyFramePhoto(work.file, work.w, work.h, work.downscaled)
}

const FRESHIE_ANIME_RETRY_HINT =
  'ระบบ AI ยังไม่ส่งรูปกลับมา — กรุณากด Generate 3D อีกครั้ง (หรือเปลี่ยนรูปแล้วลองใหม่)'

const freshieStatsFormatted = computed(() =>
  new Intl.NumberFormat('th-TH').format(Math.max(0, freshieStatsDisplay.value))
)

function animateFreshieStatsTo(target: number) {
  if (typeof window === 'undefined') {
    freshieStatsDisplay.value = target
    return
  }
  cancelAnimationFrame(freshieStatsAnimFrame)
  const start = freshieStatsDisplay.value
  const diff = target - start
  if (diff === 0) return
  const duration = 650
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration)
    const eased = 1 - (1 - p) ** 3
    freshieStatsDisplay.value = Math.round(start + diff * eased)
    if (p < 1) freshieStatsAnimFrame = requestAnimationFrame(step)
    else freshieStatsDisplay.value = target
  }
  requestAnimationFrame(step)
}

function pulseFreshieStats() {
  freshieStatsBump.value = true
  window.setTimeout(() => {
    freshieStatsBump.value = false
  }, 700)
}

function applyFreshieStatsTotal(total: number, animate = true) {
  const n = Math.max(0, Number(total) || 0)
  if (n === freshieStatsTotal.value) return
  freshieStatsTotal.value = n
  if (animate) animateFreshieStatsTo(n)
  else freshieStatsDisplay.value = n
}

function bumpFreshieStatsLocal(extra?: number) {
  const next =
    typeof extra === 'number' && Number.isFinite(extra)
      ? Math.max(freshieStatsTotal.value, extra)
      : freshieStatsTotal.value + 1
  applyFreshieStatsTotal(next, true)
  pulseFreshieStats()
}

async function fetchFreshieStats() {
  try {
    const res = await $fetch<{ total?: number }>(buildApiPath('public/freshie-frame/stats'), {
      cache: 'no-store'
    })
    applyFreshieStatsTotal(Number(res?.total ?? 0), true)
  } catch {
    /* ignore poll errors */
  }
}

function humanizeAnimeError(raw: unknown): string {
  const m = String(raw || '').trim()
  if (!m) return FRESHIE_ANIME_RETRY_HINT
  const low = m.toLowerCase()
  if (
    low.includes('did not return images') ||
    low.includes('ai_gateway') ||
    low.includes('chat.completion') ||
    low.includes('gen-') ||
    low.includes('"content":null') ||
    low.includes('finish_reason') ||
    low.includes('freshie_anime') ||
    m.startsWith('{') ||
    m.length > 140
  ) {
    return FRESHIE_ANIME_RETRY_HINT
  }
  if (low.includes('413') || low.includes('payload_too_large')) {
    return 'รูปใหญ่เกินไป — ลองรูปเล็กลงแล้วกด Generate 3D อีกครั้ง'
  }
  if (low.includes('timeout')) {
    return 'ใช้เวลานานเกินไป — กรุณากด Generate 3D อีกครั้ง'
  }
  return m
}

async function generateAnime3d() {
  if (!uploadedOriginalFile.value || animeLoading.value) return
  animeLoading.value = true
  animeError.value = ''
  errorMsg.value = ''
  clearFramePhoto()
  try {
    let sendFile = uploadedOriginalFile.value
    const bmp = await createImageBitmap(sendFile).catch(() => null)
    if (bmp) {
      const packed = await compressFileForAnimeUpload(sendFile, bmp.width, bmp.height)
      bmp.close()
      sendFile = packed.file
      if (packed.compressed) {
        uploadedOriginalFile.value = packed.file
        revokeUploadedOriginalUrl()
        uploadedOriginalUrl.value = URL.createObjectURL(packed.file)
        photoOptimizeHint.value = `บีบรูปก่อนส่ง AI (ขอบยาว ≤ ${FRESHIE_ANIME_LONG_EDGE_MAX}px, ≤ ~${Math.round(FRESHIE_ANIME_MAX_BYTES / 1024)}KB)`
      }
    }
    const filePayload = await fileToUploadPayload(sendFile)
    const res = await $fetch<{
      success: boolean
      imageUrl?: string
      imageBase64?: string
      mimeType?: string
    }>(buildApiPath('freshie-frame/anime-3d'), {
      method: 'POST',
      credentials: 'include',
      body: { file: filePayload, style: '3d_anime' }
    })
    if (res.imageBase64) {
      const mime = res.mimeType || 'image/jpeg'
      const bin = atob(res.imageBase64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      await blobToFrameFile(new Blob([bytes], { type: mime }), mime)
      if (typeof (res as { statsTotal?: number }).statsTotal === 'number') {
        bumpFreshieStatsLocal((res as { statsTotal?: number }).statsTotal)
      } else {
        bumpFreshieStatsLocal()
      }
      return
    }
    if (res.imageUrl) {
      const r = await fetch(res.imageUrl, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const blob = await r.blob()
      if (!blob.size) throw new Error('empty image')
      await blobToFrameFile(blob, blob.type || 'image/jpeg')
      if (typeof (res as { statsTotal?: number }).statsTotal === 'number') {
        bumpFreshieStatsLocal((res as { statsTotal?: number }).statsTotal)
      } else {
        bumpFreshieStatsLocal()
      }
      return
    }
    throw new Error('No image in response')
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      (typeof e?.message === 'string' ? e.message : '') ||
      'แปลงรูปอนิเมะ 3D ไม่สำเร็จ'
    animeError.value = humanizeAnimeError(msg)
  } finally {
    animeLoading.value = false
  }
}

async function prepareImageFile(file: File) {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    throw new Error('Could not open image. Try JPG or PNG.')
  }
  const w = bitmap.width
  const h = bitmap.height
  bitmap.close()
  return downscaleImageFileIfNeeded(file, w, h)
}

async function setFileNormal(file: File) {
  if (!file.type.startsWith('image/')) {
    errorMsg.value = 'Please choose an image file (JPG, PNG, or WebP).'
    return
  }
  photoMode.value = 'normal'
  revokeUploadedOriginalUrl()
  uploadedOriginalFile.value = null
  resultUrl.value = null
  resultExtraHint.value = ''
  animeError.value = ''
  try {
    const work = await prepareImageFile(file)
    await applyFramePhoto(work.file, work.w, work.h, work.downscaled)
  } catch {
    errorMsg.value = 'Could not open image. Try JPG or PNG.'
  }
}

async function setFileForAi(file: File) {
  if (!file.type.startsWith('image/')) {
    animeError.value = 'รองรับเฉพาะ JPG, PNG, WebP'
    return
  }
  if (!isPortalLoggedIn.value) {
    animeError.value = 'ต้องเข้าสู่ระบบ UBU Portal ก่อน'
    return
  }
  photoMode.value = 'ai'
  animeError.value = ''
  clearFramePhoto()
  revokeUploadedOriginalUrl()
  uploadedOriginalFile.value = null
  try {
    const prep = await prepareImageFile(file)
    const work = await compressFileForAnimeUpload(prep.file, prep.w, prep.h)
    uploadedOriginalFile.value = work.file
    uploadedOriginalUrl.value = URL.createObjectURL(work.file)
    photoOptimizeHint.value = work.compressed
      ? `บีบรูปสำหรับ AI แล้ว (ขอบยาว ≤ ${FRESHIE_ANIME_LONG_EDGE_MAX}px)`
      : ''
  } catch {
    animeError.value = 'เปิดรูปไม่สำเร็จ'
  }
}

function onInputChange(ev: Event) {
  const t = ev.target as HTMLInputElement
  const f = t.files?.[0]
  if (f) {
    if (filePickTarget === 'ai') void setFileForAi(f)
    else void setFileNormal(f)
  }
  t.value = ''
}

function onDrop(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = false
  const f = ev.dataTransfer?.files?.[0]
  if (!f) return
  if (dragTarget.value === 'ai') {
    if (!isPortalLoggedIn.value) {
      goLoginForAi()
      return
    }
    void setFileForAi(f)
  } else {
    void setFileNormal(f)
  }
}

function onDragOver(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onPreviewClick() {
  if (!previewObjectUrl.value) {
    onNormalZoneClick()
  }
}

function onPreviewKeydown(e: KeyboardEvent) {
  if (previewObjectUrl.value) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    triggerFileNormal()
  }
}

async function generate() {
  if (!canGenerate.value) return
  loading.value = true
  errorMsg.value = ''
  resultUrl.value = null
  resultExtraHint.value = ''
  try {
    const payload = isTextTheme.value
      ? await composeFullTextFrameForApi()
      : await composeAdjustedPhotoForApi()
    const res = await $fetch<{ success: boolean; imageUrl: string; statsTotal?: number }>(
      buildApiPath('public/freshie-frame/generate'),
      {
        method: 'POST',
        body: {
          themeId: selectedTheme.value,
          clientComposed: isTextTheme.value,
          file: {
            name: payload.name,
            mimeType: payload.mimeType,
            contentBase64: payload.contentBase64,
            size: payload.size
          }
        }
      }
    )
    resultUrl.value = res.imageUrl
    if (typeof res.statsTotal === 'number') {
      bumpFreshieStatsLocal(res.statsTotal)
    } else {
      bumpFreshieStatsLocal()
    }
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      e?.data?.error ||
      (typeof e?.message === 'string' ? e.message : '') ||
      'Could not create frame'
    errorMsg.value = String(msg)
  } finally {
    loading.value = false
  }
}

async function downloadImage() {
  if (!resultUrl.value) return
  const url = resultUrl.value
  const name = `ubu-freshie-theme-${selectedTheme.value || 'x'}.jpg`
  resultExtraHint.value = ''
  try {
    const r = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const blob = await r.blob()
    if (!blob.size) throw new Error('empty blob')
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = name
    a.rel = 'noopener'
    a.click()
    setTimeout(() => URL.revokeObjectURL(u), 5000)
  } catch {
    resultExtraHint.value =
      'ดาวน์โหลดอัตโนมัติไม่สำเร็จ — เปิดแท็บรูปแล้วคลิกขวา “บันทึกรูปเป็น…” หรือกดค้างที่รูป (มือถือ) เพื่อบันทึก'
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

let stackResizeObserver: ResizeObserver | null = null
let scrollLockPrev: { html: string; body: string } | null = null

onMounted(() => {
  const html = document.documentElement
  const body = document.body
  scrollLockPrev = { html: html.style.overflow, body: body.style.overflow }
  html.style.overflow = 'hidden'
  body.style.overflow = 'hidden'

  void fetchPortalUser()
  void fetchFreshieStats()
  freshieStatsPollTimer = setInterval(() => {
    void fetchFreshieStats()
  }, 3000)
  if (String(route.query.photo || '') === 'ai') {
    photoMode.value = 'ai'
  } else if (import.meta.client) {
    const stored = sessionStorage.getItem('ff_return_after_login')
    if (stored?.includes('photo=ai')) {
      photoMode.value = 'ai'
      sessionStorage.removeItem('ff_return_after_login')
    }
  }
  window.addEventListener('user-login-success', onPortalLoginSuccess)

  nextTick(() => {
    measureStack()
    if (typeof ResizeObserver === 'undefined') return
    stackResizeObserver = new ResizeObserver(() => {
      measureStack()
      clampPhotoPan()
    })
    if (stackRef.value) stackResizeObserver.observe(stackRef.value)
  })
})

watch(stackRef, (el, prev) => {
  if (!stackResizeObserver) return
  if (prev) stackResizeObserver.unobserve(prev)
  if (el) stackResizeObserver.observe(el)
})

onUnmounted(() => {
  if (freshieStatsPollTimer) {
    clearInterval(freshieStatsPollTimer)
    freshieStatsPollTimer = null
  }
  cancelAnimationFrame(freshieStatsAnimFrame)
  if (scrollLockPrev) {
    document.documentElement.style.overflow = scrollLockPrev.html
    document.body.style.overflow = scrollLockPrev.body
    scrollLockPrev = null
  }
  window.removeEventListener('user-login-success', onPortalLoginSuccess)
  stackResizeObserver?.disconnect()
  stackResizeObserver = null
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value)
  revokeUploadedOriginalUrl()
})
</script>

<template>
  <div class="ff-root" :style="pageBgStyle">
    <div class="ff-blob ff-blob--a" aria-hidden="true" />
    <div class="ff-blob ff-blob--b" aria-hidden="true" />
    <div class="ff-blob ff-blob--c" aria-hidden="true" />

    <div class="ff-shell">
      <header class="ff-head">
        <p class="ff-glass-pill ff-pill">
          <span class="ff-dot" aria-hidden="true" />
          ยินดีต้อนรับน้องใหม่ UBU
        </p>
        <div
          class="ff-live-stats ff-font-prompt"
          :class="{ 'ff-live-stats--bump': freshieStatsBump }"
          role="status"
          aria-live="polite"
          :aria-label="`สร้างเฟรมสำเร็จแล้ว ${freshieStatsFormatted} ครั้ง`"
        >
          <span class="ff-live-stats__shine" aria-hidden="true" />
          <span class="ff-live-stats__icon" aria-hidden="true">✨</span>
          <span class="ff-live-stats__text">
            <span class="ff-live-stats__label">สร้างเฟรมสำเร็จแล้ว</span>
            <span class="ff-live-stats__count">
              <span class="ff-live-stats__num">{{ freshieStatsFormatted }}</span>
              <span class="ff-live-stats__unit">ครั้ง</span>
            </span>
          </span>
          <span class="ff-live-stats__live" aria-hidden="true">
            <span class="ff-live-stats__live-dot" />
            LIVE
          </span>
        </div>
        <h1 class="ff-title ff-gradient-text ff-font">
          แต่งโปรไฟล์ให้ปังก่อนเปิดเทอม
        </h1>
        <p class="ff-lead-tight ff-font-prompt">
          อัปโหลดรูป · เลือกธีม · สร้าง · โหลดหลังประมวลผล
        </p>
        <div class="ff-steps-rail ff-font-prompt">
          <div class="ff-steps" role="presentation">
            <span
              class="ff-step-chip"
              :class="{ 'ff-step-chip--hot': !previewObjectUrl }"
            >
              <span class="ff-step-chip__n">1</span>
              อัปโหลด
            </span>
            <span class="ff-step-chip">
              <span class="ff-step-chip__n">2</span>
              เลือกธีม
            </span>
            <span class="ff-step-chip" :class="{ 'ff-step-chip--hot': sourceFile && previewObjectUrl }">
              <span class="ff-step-chip__n">3</span>
              จัดรูปในเฟรม
            </span>
            <span class="ff-step-chip" :class="{ 'ff-step-chip--hot': canGenerate && !loading }">
              <span class="ff-step-chip__n">4</span>
              กดสร้าง
            </span>
          </div>
        </div>
      </header>

      <div class="ff-body">
        <div class="ff-card ff-ui">
          <div class="ff-card-accent" aria-hidden="true" />
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            tabindex="-1"
            @change="onInputChange"
          >

          <div
            class="ff-split"
            :class="{ 'ff-split--text-theme': isTextTheme }"
          >
            <div class="ff-split-photo ff-panel ff-panel--side">
              <div class="ff-split-mobile-rail" aria-hidden="true" />

              <section class="ff-card-block ff-card-block--photo-top">
                <p class="ff-card-label ff-card-label--en">Photo</p>

                <div class="ff-photo-dual">
                  <div
                    class="ff-photo-dual__col"
                    :class="{ 'ff-photo-dual__col--active': photoMode === 'normal' && Boolean(previewObjectUrl) }"
                  >
                    <div
                      v-if="photoMode === 'normal' && previewObjectUrl"
                      class="ff-photo-stage ff-photo-stage--compact"
                    >
                      <div class="ff-photo-stage__row">
                        <img :src="previewObjectUrl" alt="" class="ff-photo-stage__thumb">
                      </div>
                      <button
                        type="button"
                        class="ff-btn-anime ff-btn-anime--ghost ff-font-prompt"
                        @click="onNormalZoneClick"
                      >
                        Change photo
                      </button>
                    </div>
                    <div
                      v-else
                      class="ff-drop-compact ff-drop-compact--prominent ff-drop-compact--dual ff-drop-compact--row"
                      :class="{ 'ff-drop-compact--on': dragOver && dragTarget === 'normal' }"
                      role="button"
                      tabindex="0"
                      aria-label="Upload photo"
                      @click="onNormalZoneClick"
                      @keydown.enter.prevent="onNormalZoneClick"
                      @keydown.space.prevent="onNormalZoneClick"
                      @dragover="onDragOverNormal"
                      @dragleave="onDragLeave"
                      @drop="onDropNormal"
                    >
                      <span class="ff-drop-compact-ico" aria-hidden="true">
                        <svg class="ff-cam-svg-sm" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="12" width="36" height="26" rx="5" stroke="currentColor" stroke-width="2.2" />
                          <circle cx="24" cy="25" r="7" stroke="currentColor" stroke-width="2.2" />
                          <path d="M18 12V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                        </svg>
                      </span>
                      <span class="ff-drop-compact-text">
                        <span class="ff-drop-compact-line1">Tap to browse or drop here</span>
                        <span class="ff-drop-compact-line2">JPG · PNG · WebP</span>
                      </span>
                    </div>
                  </div>

                  <div
                    class="ff-photo-dual__col ff-photo-dual__col--ai"
                    :class="{
                      'ff-photo-dual__col--active': photoMode === 'ai' && Boolean(previewObjectUrl || uploadedOriginalUrl),
                      'ff-photo-dual__col--locked': !portalUserLoading && !isPortalLoggedIn
                    }"
                  >
                    <div
                      v-if="portalUserLoading"
                      class="ff-drop-compact ff-drop-compact--prominent ff-drop-compact--ai ff-drop-compact--dual ff-drop-compact--row ff-drop-compact--busy"
                      aria-busy="true"
                    >
                      <span class="ff-spinner ff-spinner--sm" aria-hidden="true" />
                      <span class="ff-drop-compact-text">
                        <span class="ff-drop-compact-line1">Checking…</span>
                      </span>
                    </div>

                    <div
                      v-else-if="!isPortalLoggedIn"
                      class="ff-drop-compact ff-drop-compact--prominent ff-drop-compact--ai ff-drop-compact--dual ff-drop-compact--row ff-drop-compact--locked"
                      role="button"
                      tabindex="0"
                      aria-label="AI Anime 3D — sign in with UBU Portal"
                      @click="goLoginForAi"
                      @keydown.enter.prevent="goLoginForAi"
                      @keydown.space.prevent="goLoginForAi"
                    >
                      <span class="ff-drop-compact-ico ff-drop-compact-ico--ai" aria-hidden="true">✨</span>
                      <span class="ff-drop-compact-text">
                        <span class="ff-drop-compact-line1">AI Anime 3D</span>
                        <span class="ff-drop-compact-line2 ff-drop-compact-line2--lock">
                          <svg class="ff-lock-ico" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm-2 5V4a2 2 0 1 1 4 0v2H6z" />
                          </svg>
                          Sign in
                        </span>
                      </span>
                    </div>

                    <div
                      v-else-if="photoMode === 'ai' && uploadedOriginalUrl"
                      class="ff-photo-stage ff-photo-stage--compact"
                    >
                      <div class="ff-photo-stage__row">
                        <img :src="previewObjectUrl || uploadedOriginalUrl || ''" alt="" class="ff-photo-stage__thumb">
                        <span v-if="previewObjectUrl" class="ff-photo-stage__badge ff-font-prompt">3D</span>
                      </div>
                      <div class="ff-photo-stage__actions">
                        <button
                          v-if="!previewObjectUrl"
                          type="button"
                          class="ff-btn-anime ff-font-prompt"
                          :class="{ 'ff-btn-anime--loading': animeLoading }"
                          :disabled="animeLoading"
                          :aria-busy="animeLoading"
                          @click="generateAnime3d"
                        >
                          <span v-if="animeLoading" class="ff-btn-anime__loading">
                            <span class="ff-btn-anime__shimmer" aria-hidden="true" />
                            <span class="ff-btn-anime__label">Generating…</span>
                          </span>
                          <span v-else>Generate 3D</span>
                        </button>
                        <button
                          v-else
                          type="button"
                          class="ff-btn-anime ff-font-prompt"
                          :class="{ 'ff-btn-anime--loading': animeLoading }"
                          :disabled="animeLoading"
                          :aria-busy="animeLoading"
                          @click="generateAnime3d"
                        >
                          <span v-if="animeLoading" class="ff-btn-anime__loading">
                            <span class="ff-btn-anime__shimmer" aria-hidden="true" />
                            <span class="ff-btn-anime__label">Generating…</span>
                          </span>
                          <span v-else>Regenerate</span>
                        </button>
                        <button
                          type="button"
                          class="ff-btn-anime ff-btn-anime--ghost ff-font-prompt"
                          :disabled="animeLoading"
                          @click="onAiZoneClick"
                        >
                          Change photo
                        </button>
                      </div>
                    </div>

                    <div
                      v-else
                      class="ff-drop-compact ff-drop-compact--prominent ff-drop-compact--ai ff-drop-compact--dual ff-drop-compact--row"
                      :class="{ 'ff-drop-compact--on': dragOver && dragTarget === 'ai' }"
                      role="button"
                      tabindex="0"
                      aria-label="Convert photo with AI Anime 3D"
                      @click="onAiZoneClick"
                      @keydown.enter.prevent="onAiZoneClick"
                      @keydown.space.prevent="onAiZoneClick"
                      @dragover="onDragOverAi"
                      @dragleave="onDragLeave"
                      @drop="onDropAi"
                    >
                      <span class="ff-drop-compact-ico ff-drop-compact-ico--ai" aria-hidden="true">✨</span>
                      <span class="ff-drop-compact-text">
                        <span class="ff-drop-compact-line1">Tap to convert AI</span>
                        <span class="ff-drop-compact-line2">JPG · PNG · WebP</span>
                      </span>
                    </div>
                  </div>
                </div>

                <p v-if="photoOptimizeHint" class="ff-hint ff-hint--info">{{ photoOptimizeHint }}</p>
                <p v-if="animeError" class="ff-err ff-shake">{{ animeError }}</p>

              </section>

              <div class="ff-side-soft-rail" aria-hidden="true" />
            </div>

            <div
              class="ff-split-preview"
              :class="{ 'ff-split-preview--text': isTextTheme }"
            >
              <section class="ff-card-block ff-card-block--preview ff-panel ff-panel--preview">
                <p class="ff-card-label ff-card-label--en">Preview</p>
                <div
                  class="ff-stack-wrap"
                  :class="{
                    'ff-stack-wrap--empty': !previewObjectUrl,
                    'ff-stack-wrap--drag': dragOver && !previewObjectUrl
                  }"
                  :role="previewObjectUrl ? undefined : 'button'"
                  :tabindex="previewObjectUrl ? undefined : 0"
                  :aria-label="previewObjectUrl ? 'Frame and photo preview' : 'Upload profile photo'"
                  @click="onPreviewClick"
                  @keydown="onPreviewKeydown"
                  @dragover="onDragOver"
                  @dragleave="onDragLeave"
                  @drop="onDrop"
                >
                  <div
                    ref="stackRef"
                    class="ff-stack"
                    :class="{ 'ff-stack--has-photo': Boolean(previewObjectUrl) }"
                    @wheel="onStackWheel"
                  >
                    <div v-if="previewObjectUrl" class="ff-photo-layer">
                      <div
                        class="ff-photo-mover"
                        :class="{
                          'ff-photo-mover--drag': draggingPhoto,
                          'ff-photo-mover--resizing': resizingPhoto,
                          'ff-photo-mover--rotating': rotatingPhoto
                        }"
                        :style="photoMoverOuterStyle"
                        @pointerdown="onPhotoPointerDown"
                        @pointermove="onPhotoPointerMove"
                        @pointerup="onPhotoPointerUp"
                        @pointercancel="onPhotoPointerUp"
                      >
                        <div class="ff-photo-mover__inner" :style="photoMoverInnerStyle">
                          <img
                            :src="previewObjectUrl"
                            class="ff-photo-mover-img"
                            alt=""
                            draggable="false"
                            @load="onPhotoLoad"
                            @error="onPhotoError"
                          >
                          <div class="ff-photo-hud" aria-hidden="true">
                            <div class="ff-photo-hud__frame" />
                            <span class="ff-photo-hud__grip ff-photo-hud__grip--tl" />
                            <span class="ff-photo-hud__grip ff-photo-hud__grip--tr" />
                            <span class="ff-photo-hud__grip ff-photo-hud__grip--bl" />
                            <button
                              type="button"
                              class="ff-photo-hud__handle"
                              aria-label="Drag corner to resize photo"
                              tabindex="-1"
                              @pointerdown="onResizeHandleDown"
                              @pointermove="onResizeHandleMove"
                              @pointerup="onResizeHandleUp"
                              @pointercancel="onResizeHandleUp"
                            />
                          </div>
                          <button
                            type="button"
                            class="ff-photo-mover-rotate"
                            aria-label="Drag around the frame to rotate photo"
                            tabindex="-1"
                            @pointerdown="onRotateHandleDown"
                            @pointermove="onRotateHandleMove"
                            @pointerup="onRotateHandleUp"
                            @pointercancel="onRotateHandleUp"
                          />
                        </div>
                      </div>
                    </div>
                    <div v-else-if="sourceFile && !previewObjectUrl" class="ff-stack-loading ff-font-prompt">
                      Preparing image…
                    </div>
                    <div v-else-if="!previewObjectUrl" class="ff-stack-placeholder ff-font-prompt">
                      Tap to upload<br>
                      <span class="ff-stack-placeholder-sub">or drop JPG · PNG · WebP</span>
                    </div>
                    <img
                      class="ff-stack-frame"
                      :src="themePreviewUrl(activeTheme.previewFile)"
                      :alt="activeTheme.title"
                      width="512"
                      height="512"
                      decoding="async"
                    >
                    <div
                      v-if="isTextTheme"
                      class="ff-stack-text"
                      :class="{ 'ff-stack-text--empty': frameTextIsPlaceholder }"
                      :style="textFrameOverlayStyle"
                      aria-hidden="true"
                    >
                      <span
                        class="ff-stack-text__label"
                        :class="{ 'ff-stack-text__label--ghost': frameTextIsPlaceholder }"
                        :style="textFrameLabelStyle"
                      >{{ frameTextDisplay }}</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="isTextTheme"
                  class="ff-text-frame-panel ff-font-prompt"
                  :class="{ 'ff-text-frame-panel--pulse': frameTextIsPlaceholder }"
                >
                  <div class="ff-text-frame-panel__head">
                    <span class="ff-text-frame-panel__badge" aria-hidden="true">✨</span>
                    <div class="ff-text-frame-panel__head-copy">
                      <strong class="ff-text-frame-panel__title">ใส่ชื่อหรือคณะของคุณ</strong>
                      <span class="ff-text-frame-panel__subtitle">ธีมนี้ใส่ข้อความในช่องขาวด้านล่างเฟรมได้</span>
                    </div>
                  </div>
                  <label class="ff-text-frame-panel__label" for="ff-frame-text-input">
                    พิมพ์ข้อความที่นี่
                  </label>
                  <input
                    id="ff-frame-text-input"
                    v-model="frameCustomText"
                    type="text"
                    class="ff-text-frame-panel__input"
                    :maxlength="FRESHIE_FRAME_TEXT_MAX"
                    :placeholder="TEXT_FRAME_PLACEHOLDER"
                    autocomplete="off"
                    spellcheck="false"
                    @click.stop
                  >
                  <div class="ff-text-frame-panel__controls">
                    <div class="ff-text-frame-panel__control">
                      <span class="ff-text-frame-panel__size-label">ขนาดตัวอักษร</span>
                      <div class="ff-text-frame-panel__size-btns">
                        <button
                          type="button"
                          class="ff-text-frame-panel__size-btn"
                          aria-label="ลดขนาดตัวอักษร"
                          :disabled="frameTextFontScale <= TEXT_FRAME_FONT_SCALE_MIN"
                          @click="bumpFrameTextFontScale(-TEXT_FRAME_FONT_SCALE_STEP)"
                        >
                          A−
                        </button>
                        <span class="ff-text-frame-panel__size-val" aria-live="polite">
                          {{ Math.round(frameTextFontScale * 100) }}%
                        </span>
                        <button
                          type="button"
                          class="ff-text-frame-panel__size-btn"
                          aria-label="เพิ่มขนาดตัวอักษร"
                          :disabled="frameTextFontScale >= TEXT_FRAME_FONT_SCALE_MAX"
                          @click="bumpFrameTextFontScale(TEXT_FRAME_FONT_SCALE_STEP)"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                    <div class="ff-text-frame-panel__control">
                      <span class="ff-text-frame-panel__size-label">เลื่อนขึ้น/ลง</span>
                      <div class="ff-text-frame-panel__size-btns">
                        <button
                          type="button"
                          class="ff-text-frame-panel__size-btn"
                          aria-label="เลื่อนข้อความขึ้น"
                          :disabled="frameTextOffsetY <= TEXT_FRAME_OFFSET_Y_MIN"
                          @click="bumpFrameTextOffsetY(-TEXT_FRAME_OFFSET_Y_STEP)"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          class="ff-text-frame-panel__size-btn ff-text-frame-panel__size-btn--reset"
                          aria-label="รีเซ็ตตำแหน่งข้อความ"
                          @click="frameTextOffsetY = TEXT_FRAME_OFFSET_Y_DEFAULT"
                        >
                          กลาง
                        </button>
                        <button
                          type="button"
                          class="ff-text-frame-panel__size-btn"
                          aria-label="เลื่อนข้อความลง"
                          :disabled="frameTextOffsetY >= TEXT_FRAME_OFFSET_Y_MAX"
                          @click="bumpFrameTextOffsetY(TEXT_FRAME_OFFSET_Y_STEP)"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                  <label class="ff-text-frame-panel__slider-label" for="ff-frame-text-offset">
                    ปรับตำแหน่งละเอียด
                  </label>
                  <input
                    id="ff-frame-text-offset"
                    class="ff-text-frame-panel__slider"
                    type="range"
                    min="-38"
                    max="38"
                    step="2.5"
                    :value="Math.round(frameTextOffsetY * 100)"
                    @input="onFrameTextOffsetSlider"
                  >
                  <p class="ff-text-frame-panel__hint">
                    ปรับตำแหน่งให้ตรงกลางช่องขาว · สูงสุด {{ FRESHIE_FRAME_TEXT_MAX }} ตัวอักษร
                  </p>
                </div>
                <div v-if="previewObjectUrl && natDims.w" class="ff-adjust-bar">
                  <span class="ff-adjust-hint">Drag to move · corner resize · scroll zoom · drag round knob under your photo to rotate (or use buttons)</span>
                  <div class="ff-adjust-btns">
                    <button type="button" class="ff-adjust-btn" aria-label="Zoom out" @click="bumpPhotoZoom(-0.1)">
                      −
                    </button>
                    <button type="button" class="ff-adjust-btn ff-adjust-btn-wide" @click="resetPhotoAdjust">
                      Reset
                    </button>
                    <button type="button" class="ff-adjust-btn" aria-label="Zoom in" @click="bumpPhotoZoom(0.1)">
                      +
                    </button>
                  </div>
                  <div class="ff-adjust-btns ff-adjust-btns--rotate">
                    <button type="button" class="ff-adjust-btn" aria-label="Rotate 90 degrees counter-clockwise" @click="rotatePhoto90(-1)">
                      ↺ 90°
                    </button>
                    <button type="button" class="ff-adjust-btn ff-adjust-btn-narrow" aria-label="Rotate 5 degrees counter-clockwise" @click="bumpPhotoRotation(-5)">
                      −5°
                    </button>
                    <button type="button" class="ff-adjust-btn ff-adjust-btn-narrow" aria-label="Rotate 5 degrees clockwise" @click="bumpPhotoRotation(5)">
                      +5°
                    </button>
                    <button type="button" class="ff-adjust-btn" aria-label="Rotate 90 degrees clockwise" @click="rotatePhoto90(1)">
                      ↻ 90°
                    </button>
                  </div>
                </div>
              </section>
              <section
                class="ff-card-block ff-card-block--actions ff-panel ff-panel--side ff-card-block--create-under-preview ff-create-slot ff-create-slot--desktop"
              >
                <button
                  type="button"
                  class="ff-btn-gen ff-btn-gen-compact ff-font"
                  :disabled="!canGenerate"
                  @click="generate"
                >
                  <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                    <span class="ff-spinner" />
                    Processing…
                  </span>
                  <span v-else>Create frame</span>
                </button>
                <p v-if="errorMsg" class="ff-err ff-shake">{{ errorMsg }}</p>
              </section>
            </div>

            <div class="ff-split-themes ff-panel ff-panel--side">
              <section class="ff-card-block ff-card-block--themes">
                <div class="ff-theme-groups">
                  <div class="ff-theme-group ff-theme-group--photo">
                    <p class="ff-theme-group__label ff-card-label ff-card-label--en">Theme</p>
                    <div class="ff-theme-row ff-theme-row--photo" role="list">
                      <button
                        v-for="(t, idx) in photoFrameThemes"
                        :key="t.id"
                        type="button"
                        class="ff-theme-opt"
                        :class="{ 'ff-theme-opt--active': selectedTheme === t.id }"
                        role="listitem"
                        :style="{ animationDelay: `${idx * 0.04}s` }"
                        @click="pickTheme(t.id)"
                      >
                        <span class="ff-theme-opt__thumb-slot">
                          <span class="ff-theme-opt__thumb">
                            <img
                              :src="themePreviewUrl(t.previewFile)"
                              :alt="t.title"
                              width="96"
                              height="96"
                              loading="eager"
                              decoding="async"
                            >
                          </span>
                        </span>
                        <span class="ff-theme-opt__name">{{ t.title }}</span>
                      </button>
                    </div>
                  </div>
                  <div v-if="textFrameThemes.length" class="ff-theme-group ff-theme-group--text">
                    <p class="ff-theme-group__label ff-card-label ff-theme-group__label--text">Text</p>
                    <div class="ff-theme-row ff-theme-row--text" role="list">
                      <button
                        v-for="(t, idx) in textFrameThemes"
                        :key="t.id"
                        type="button"
                        class="ff-theme-opt ff-theme-opt--text"
                        :class="{ 'ff-theme-opt--active': selectedTheme === t.id }"
                        role="listitem"
                        :style="{ animationDelay: `${idx * 0.05}s` }"
                        @click="pickTheme(t.id)"
                      >
                        <span class="ff-theme-opt__thumb-slot">
                          <span class="ff-theme-opt__thumb">
                            <img
                              :src="themePreviewUrl(t.previewFile)"
                              :alt="t.title"
                              width="96"
                              height="96"
                              loading="eager"
                              decoding="async"
                            >
                          </span>
                          <span class="ff-theme-opt__badge ff-font-prompt">✏️</span>
                        </span>
                        <span class="ff-theme-opt__name">{{ t.title }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div class="ff-side-soft-rail" aria-hidden="true" />
            </div>

            <section
              class="ff-card-block ff-card-block--actions ff-panel ff-panel--side ff-card-block--create-under-preview ff-create-slot ff-create-slot--mobile"
            >
              <button
                type="button"
                class="ff-btn-gen ff-btn-gen-compact ff-font"
                :disabled="!canGenerate"
                @click="generate"
              >
                <span v-if="loading" class="inline-flex items-center justify-center gap-2">
                  <span class="ff-spinner" />
                  Processing…
                </span>
                <span v-else>Create frame</span>
              </button>
              <p v-if="errorMsg" class="ff-err ff-shake">{{ errorMsg }}</p>
            </section>
          </div>
        </div>
      </div>

      <p class="ff-foot ff-ui">
        Copyright ©2026 Office of Digital Technology and Learning Resources Ubon Ratchathani University, All rights reserved
      </p>

      <Transition name="ff-fade">
        <div v-if="resultUrl" class="ff-result-overlay">
          <div class="ff-result-panel ff-ui">
            <p class="ff-result-title ff-font">Done</p>
            <a
              :href="resultUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ff-result-img-wrap"
            >
              <img :src="resultUrl" alt="Framed result" class="ff-result-img">
            </a>
            <div class="ff-result-actions">
              <button type="button" class="ff-btn-dl ff-font" @click="downloadImage">
                Download
              </button>
              <button type="button" class="ff-btn-secondary ff-font" @click="clearResult">
                Close
              </button>
            </div>
            <p v-if="resultExtraHint" class="ff-result-hint ff-font-prompt">{{ resultExtraHint }}</p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.ff-font {
  font-family: Kanit, system-ui, sans-serif;
}
.ff-font-prompt {
  font-family: Prompt, Kanit, system-ui, sans-serif;
}

.ff-ui {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

.ff-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background-color: #93c5fe;
  background-image:
    linear-gradient(
      165deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(219, 234, 254, 0.72) 40%,
      rgba(252, 231, 243, 0.68) 75%,
      rgba(254, 249, 195, 0.45) 100%
    ),
    var(--ff-page-bg, linear-gradient(180deg, #bfdbfe, #fce7f3));
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
}

.ff-root::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.42;
  background-image: radial-gradient(circle at center, rgba(236, 72, 153, 0.09) 1px, transparent 1.5px);
  background-size: 18px 18px;
  mask-image: radial-gradient(ellipse 88% 72% at 50% 48%, black 0%, transparent 74%);
}

.ff-shell {
  position: relative;
  z-index: 2;
  isolation: isolate;
  width: 100%;
  max-width: min(calc(100% - 0.75rem), clamp(22.5rem, 92vw, 34rem));
  height: calc(100dvh - 0.5rem);
  max-height: calc(100dvh - 0.5rem);
  margin: 0 auto;
  padding: 0.12rem 0.45rem 0.2rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
}
@media (min-width: 640px) {
  .ff-shell {
    max-width: min(calc(100% - 1.25rem), clamp(24rem, 88vw, 38rem));
    padding: 0.15rem 0.55rem 0.28rem;
  }
}
@media (min-width: 900px) {
  .ff-shell {
    max-width: min(calc(100% - 1.5rem), 88rem);
    padding: 0.18rem 0.85rem 0.22rem;
  }
}
@media (min-width: 1280px) {
  .ff-shell {
    max-width: min(calc(100% - 2rem), 96rem);
    padding: 0.22rem 1.1rem 0.26rem;
  }
}

.ff-head {
  flex-shrink: 0;
  text-align: center;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.ff-live-stats {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.42rem auto 0.36rem;
  width: max-content;
  max-width: 100%;
  padding: 0.22rem 0.55rem 0.22rem 0.42rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(219, 234, 254, 0.88));
  border: 1.5px solid rgba(99, 102, 241, 0.35);
  box-shadow:
    0 4px 18px rgba(79, 70, 229, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
  animation: ff-live-stats-in 0.55s ease-out both;
}
.ff-live-stats--bump {
  animation: ff-live-stats-bump 0.65s ease-out;
}
.ff-live-stats__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255, 255, 255, 0.65) 50%,
    transparent 70%
  );
  animation: ff-live-stats-shine 2.8s ease-in-out infinite;
  pointer-events: none;
}
.ff-live-stats__icon {
  font-size: 0.9em;
  line-height: 1;
  animation: ff-live-stats-sparkle 1.6s ease-in-out infinite;
}
.ff-live-stats__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  line-height: 1.1;
}
.ff-live-stats__label {
  font-size: clamp(0.44rem, 0.28vw + 0.38rem, 0.58rem);
  font-weight: 700;
  color: #4338ca;
  letter-spacing: 0.01em;
}
.ff-live-stats__count {
  display: flex;
  align-items: baseline;
  gap: 0.12rem;
}
.ff-live-stats__num {
  font-size: clamp(0.72rem, 0.55vw + 0.5rem, 1rem);
  font-weight: 800;
  background: linear-gradient(90deg, #4f46e5, #db2777, #7c3aed);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ff-live-stats-gradient 3s linear infinite;
  font-variant-numeric: tabular-nums;
}
.ff-live-stats__unit {
  font-size: clamp(0.44rem, 0.26vw + 0.36rem, 0.56rem);
  font-weight: 700;
  color: #6b21a8;
}
.ff-live-stats__live {
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  margin-left: 0.12rem;
  padding: 0.1rem 0.28rem;
  border-radius: 999px;
  font-size: clamp(0.38rem, 0.22vw + 0.32rem, 0.5rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #be123c;
  background: rgba(254, 226, 226, 0.85);
}
.ff-live-stats__live-dot {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #ef4444;
  animation: ff-live-stats-pulse 1.2s ease-in-out infinite;
}
@keyframes ff-live-stats-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes ff-live-stats-bump {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes ff-live-stats-shine {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}
@keyframes ff-live-stats-sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.15) rotate(8deg);
  }
}
@keyframes ff-live-stats-gradient {
  to {
    background-position: 200% center;
  }
}
@keyframes ff-live-stats-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.85);
  }
}
@keyframes ff-text-slot-pulse {
  0%,
  100% {
    outline-color: rgba(236, 72, 153, 0.35);
  }
  50% {
    outline-color: rgba(59, 130, 246, 0.65);
  }
}

@keyframes ff-text-panel-glow {
  0%,
  100% {
    box-shadow:
      0 6px 20px rgba(30, 64, 175, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
  }
  50% {
    box-shadow:
      0 8px 24px rgba(236, 72, 153, 0.22),
      0 0 0 4px rgba(236, 72, 153, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ff-live-stats,
  .ff-live-stats__shine,
  .ff-live-stats__icon,
  .ff-live-stats__num,
  .ff-live-stats__live-dot,
  .ff-stack-text--empty,
  .ff-text-frame-panel--pulse {
    animation: none !important;
  }
}

.ff-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  padding: 0.1rem 0.45rem 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: clamp(0.54rem, 0.35vw + 0.48rem, 0.72rem);
  font-weight: 700;
}
@media (min-width: 640px) {
  .ff-pill {
    padding: 0.12rem 0.55rem;
  }
}

.ff-title {
  margin: 0.04rem 0 0;
  font-size: clamp(0.72rem, 0.85vw + 0.52rem, 1.45rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.ff-lead-tight {
  margin: 0.02rem 0 0;
  font-size: clamp(0.46rem, 0.32vw + 0.4rem, 0.72rem);
  color: #1e40af;
  line-height: 1.35;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);
}

.ff-steps-rail {
  margin-top: 0.22rem;
  padding: 0.26rem 0.34rem 0.24rem;
  border-radius: 0.85rem;
  background: linear-gradient(
    118deg,
    rgba(255, 255, 255, 0.78) 0%,
    rgba(219, 234, 254, 0.74) 32%,
    rgba(252, 231, 243, 0.7) 68%,
    rgba(254, 243, 199, 0.62) 100%
  );
  border: 2px solid rgba(59, 130, 246, 0.38);
  box-shadow:
    0 8px 26px -10px rgba(236, 72, 153, 0.28),
    0 2px 0 rgba(255, 255, 255, 0.55) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.ff-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.18rem 0.26rem;
  margin: 0;
  padding: 0;
}

.ff-step-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  padding: 0.12rem 0.38rem 0.12rem 0.26rem;
  border-radius: 999px;
  font-size: clamp(0.42rem, 0.22vw + 0.38rem, 0.62rem);
  font-weight: 800;
  letter-spacing: 0.01em;
  color: #1e3a8a;
  background: linear-gradient(
    175deg,
    rgba(255, 255, 255, 0.82) 0%,
    rgba(239, 246, 255, 0.78) 50%,
    rgba(253, 242, 248, 0.74) 100%
  );
  border: 2px solid rgba(236, 72, 153, 0.38);
  box-shadow:
    0 2px 0 rgba(250, 204, 21, 0.65),
    0 6px 16px -6px rgba(37, 99, 235, 0.22);
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
.ff-step-chip:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.55);
  box-shadow:
    0 3px 0 rgba(250, 204, 21, 0.75),
    0 10px 24px -8px rgba(236, 72, 153, 0.28);
}

.ff-step-chip__n {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.02rem;
  height: 1.02rem;
  padding: 0 0.14rem;
  border-radius: 999px;
  font-size: 0.48rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.18);
  background: linear-gradient(145deg, #2563eb 0%, #ec4899 48%, #facc15 100%);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.95),
    0 2px 6px rgba(30, 64, 175, 0.35);
}

.ff-step-chip--hot {
  border-color: rgba(234, 179, 8, 0.9);
  box-shadow:
    0 0 0 3px rgba(253, 224, 71, 0.55),
    0 3px 0 rgba(250, 204, 21, 0.85),
    0 12px 28px -10px rgba(236, 72, 153, 0.32);
  animation: ff-step-glow 2.4s ease-in-out infinite;
}

@keyframes ff-step-glow {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.02);
  }
}

@media (max-height: 560px) {
  .ff-steps-rail {
    padding: 0.24rem 0.32rem 0.22rem;
  }
  .ff-steps {
    gap: 0.14rem 0.22rem;
  }
}

.ff-body {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  padding-top: 0.06rem;
}

.ff-card {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding: clamp(0.22rem, 0.55dvh, 0.4rem) clamp(0.38rem, 1vw, 0.72rem)
    clamp(0.26rem, 0.65dvh, 0.45rem);
  padding-top: calc(0.26rem + 3px);
  border-radius: clamp(0.95rem, 1.3vw, 1.25rem);
  background: linear-gradient(
    175deg,
    rgba(255, 255, 255, 0.82) 0%,
    rgba(239, 246, 255, 0.78) 45%,
    rgba(252, 231, 243, 0.72) 100%
  );
  border: 2px solid rgba(59, 130, 246, 0.26);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 18px 44px -16px rgba(236, 72, 153, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.38) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.ff-card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #ec4899, #facc15, #38bdf8);
  opacity: 0.98;
  pointer-events: none;
  z-index: 1;
}

.ff-split {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 0.12rem;
}

.ff-split-preview {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: clamp(0.16rem, 0.5dvh, 0.36rem);
}

.ff-split-photo {
  flex-shrink: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.ff-split-themes {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.ff-split-mobile-rail {
  height: 1px;
  margin: 0.18rem 0 0.12rem;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(148, 163, 184, 0.45) 15%,
    rgba(148, 163, 184, 0.45) 85%,
    transparent
  );
}

.ff-side-soft-rail {
  height: 1px;
  margin: 0.12rem 0;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(148, 163, 184, 0.38) 18%,
    rgba(148, 163, 184, 0.38) 82%,
    transparent
  );
}

@media (min-width: 900px) {
  .ff-split {
    display: grid;
    grid-template-columns: minmax(min(14rem, 28vw), 1fr) minmax(0, min(46vmin, calc(100dvh - 6.25rem), 56rem));
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(0.32rem, 0.9vw, 0.85rem);
    align-items: stretch;
    min-height: 0;
  }
  .ff-split-mobile-rail {
    display: none;
  }
  .ff-split-photo {
    grid-column: 1;
    grid-row: 1;
    min-height: 0;
    overflow: hidden;
    box-shadow: 14px 0 28px -18px rgba(15, 23, 42, 0.08);
  }
  .ff-split-themes {
    grid-column: 1;
    grid-row: 2;
    min-height: 0;
    overflow: hidden;
  }
  .ff-split-preview {
    grid-column: 2;
    grid-row: 1 / -1;
    flex: unset;
    min-height: 0;
    width: 100%;
    max-width: min(46vmin, calc(100dvh - 6.25rem), 56rem);
    max-height: none;
    align-self: stretch;
  }
  .ff-side-soft-rail {
    margin: 0.22rem 0;
  }
  .ff-card-block--actions {
    gap: 0.22rem;
  }
  .ff-card-block--photo-top {
    gap: 0.22rem;
  }
  .ff-btn-gen-compact {
    padding: clamp(0.22rem, 0.45dvh, 0.36rem) clamp(0.42rem, 1vw, 0.62rem);
    font-size: clamp(0.58rem, 0.38vw + 0.48rem, 0.82rem);
  }
  .ff-drop-compact {
    padding: 0.18rem 0.28rem;
    gap: 0.24rem;
  }
  .ff-drop-compact.ff-drop-compact--prominent {
    padding: 0.3rem 0.44rem;
    min-height: 2.65rem;
  }
}

@media (min-width: 900px) and (max-height: 620px) {
  .ff-split {
    grid-template-columns: minmax(min(14rem, 28vw), 1fr) minmax(0, min(40vmin, calc(100dvh - 5.5rem), 50rem));
  }
}

.ff-card-block {
  flex-shrink: 0;
}

.ff-card-block--preview {
  flex: 1 1 0;
  min-height: min-content;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/** ปุ่ม Create frame — การ์ดแยกใต้พรีวิว (ไม่อยู่ในการ์ด Preview) */
.ff-card-block--create-under-preview {
  flex-shrink: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  gap: 0.2rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  z-index: 0;
}

.ff-card-block--create-under-preview .ff-btn-gen-compact {
  width: 100%;
}

.ff-card-block--create-under-preview .ff-btn-gen {
  color: #fff;
  text-shadow: 0 1px 1px rgba(15, 23, 42, 0.28);
}

.ff-card-block--create-under-preview .ff-btn-gen:disabled {
  color: rgba(255, 255, 255, 0.88);
}

.ff-card-block--create-under-preview .ff-spinner {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}

.ff-card-block--themes {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ff-card-block--preview .ff-card-label {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  text-align: center;
  width: 100%;
}

@media (max-width: 899px) {
  /* —— มือถือ: ทุกอย่างใน 100dvh ไม่เลื่อนหน้า —— */
  .ff-root {
    overscroll-behavior: none;
  }

  .ff-shell {
    height: 100dvh;
    max-height: 100dvh;
    padding: clamp(0.04rem, 0.6dvh, 0.1rem) clamp(0.32rem, 2.5vw, 0.45rem)
      clamp(0.03rem, 0.5dvh, 0.08rem);
  }

  .ff-head {
    flex-shrink: 0;
  }

  .ff-live-stats {
    margin: 0.32rem auto 0.28rem;
  }

  .ff-lead-tight {
    display: none;
  }

  .ff-title {
    margin: 0.02rem 0 0;
    font-size: clamp(0.58rem, 3.2vw, 0.82rem);
    line-height: 1.08;
  }

  .ff-pill {
    padding: 0.06rem 0.32rem 0.06rem 0.28rem;
    font-size: clamp(0.44rem, 2.6vw, 0.58rem);
  }

  .ff-steps-rail {
    margin-top: clamp(0.04rem, 0.5dvh, 0.1rem);
    padding: clamp(0.1rem, 0.9dvh, 0.16rem) clamp(0.12rem, 2vw, 0.2rem)
      clamp(0.08rem, 0.75dvh, 0.12rem);
    border-radius: 0.65rem;
  }

  .ff-steps {
    gap: 0.1rem 0.14rem;
  }

  .ff-step-chip {
    padding: 0.05rem 0.2rem 0.05rem 0.14rem;
    font-size: clamp(0.32rem, 2.4vw, 0.46rem);
    gap: 0.1rem;
    border-width: 1.5px;
  }

  .ff-step-chip__n {
    min-width: 0.78rem;
    height: 0.78rem;
    font-size: 0.36rem;
  }

  .ff-body {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    padding-top: 0;
  }

  .ff-card {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    padding: clamp(0.08rem, 0.55dvh, 0.14rem) clamp(0.22rem, 2vw, 0.38rem)
      clamp(0.06rem, 0.45dvh, 0.12rem);
    padding-top: calc(0.08rem + 3px);
  }

  .ff-split {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) minmax(4.25rem, 27dvh) auto;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    gap: clamp(0.04rem, 0.4dvh, 0.1rem);
  }

  .ff-split > * {
    min-width: 0;
    min-height: 0;
  }

  /* Photo → Preview → Theme → Create */
  .ff-split > .ff-split-photo {
    order: 1;
    min-height: 0;
    overflow: hidden;
  }
  .ff-split > .ff-split-preview {
    order: 2;
    min-height: 0;
    overflow: hidden;
    position: relative;
    z-index: 2;
    isolation: isolate;
  }
  .ff-split > .ff-split-themes {
    order: 3;
    min-height: 0;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  .ff-split > .ff-create-slot--mobile {
    order: 4;
    width: 100%;
    flex-shrink: 0;
    margin-top: 0;
    min-height: 0;
  }

  .ff-create-slot--desktop {
    display: none !important;
  }

  .ff-split-mobile-rail,
  .ff-split-photo .ff-side-soft-rail,
  .ff-split-themes .ff-side-soft-rail {
    display: none;
  }

  .ff-split-photo {
    flex-shrink: 0;
    gap: 0;
  }

  .ff-split-photo.ff-panel--side {
    padding: clamp(0.1rem, 0.9dvh, 0.16rem) clamp(0.16rem, 2vw, 0.22rem);
  }

  .ff-card-block--photo-top {
    gap: clamp(0.04rem, 0.35dvh, 0.08rem);
  }

  .ff-card-label {
    margin-bottom: clamp(0.04rem, 0.35dvh, 0.08rem);
    font-size: clamp(0.44rem, 2.6vw, 0.56rem);
  }

  .ff-card-block--photo-top .ff-card-label {
    margin-bottom: 0.04rem;
  }

  .ff-drop-compact.ff-drop-compact--prominent {
    min-height: 0;
    padding: clamp(0.1rem, 1dvh, 0.16rem) clamp(0.16rem, 2vw, 0.24rem);
    box-shadow: none;
  }

  .ff-drop-compact-line1 {
    font-size: clamp(0.42rem, 2.8vw, 0.54rem);
  }

  .ff-drop-compact-line2 {
    font-size: clamp(0.36rem, 2.2vw, 0.46rem);
  }

  .ff-cam-svg-sm {
    width: clamp(1rem, 5vw, 1.35rem);
    height: clamp(1rem, 5vw, 1.35rem);
  }

  .ff-hint {
    font-size: clamp(0.36rem, 2.2vw, 0.46rem);
    line-height: 1.15;
  }

  .ff-split-preview {
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: none;
    overflow: hidden;
    gap: 0;
  }

  .ff-card-block--preview.ff-panel--preview {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: clamp(0.1rem, 0.85dvh, 0.16rem) clamp(0.14rem, 2vw, 0.22rem);
  }

  .ff-card-block--preview .ff-card-label {
    margin-bottom: clamp(0.04rem, 0.35dvh, 0.08rem);
    font-size: clamp(0.44rem, 2.6vw, 0.56rem);
  }

  .ff-card-block--preview .ff-stack-wrap {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    container-type: size;
  }

  .ff-adjust-bar {
    display: none;
  }

  .ff-split-themes {
    flex: unset;
    min-height: 0;
    max-height: none;
    overflow: hidden;
  }

  .ff-split-themes.ff-panel--side {
    padding: clamp(0.08rem, 0.75dvh, 0.14rem) clamp(0.14rem, 2vw, 0.2rem);
  }

  .ff-split-themes .ff-card-block--themes {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .ff-split-themes .ff-card-block--themes .ff-card-label {
    margin-bottom: clamp(0.04rem, 0.35dvh, 0.08rem);
    font-size: clamp(0.44rem, 2.6vw, 0.56rem);
  }

  .ff-create-slot--mobile.ff-panel--side {
    padding: clamp(0.08rem, 0.65dvh, 0.12rem) clamp(0.14rem, 2vw, 0.2rem);
  }

  .ff-btn-gen-compact {
    padding: clamp(0.16rem, 1.1dvh, 0.26rem) clamp(0.36rem, 3vw, 0.55rem);
    font-size: clamp(0.58rem, 3.2vw, 0.78rem);
    border-radius: 0.4rem;
  }

  .ff-foot {
    flex-shrink: 0;
    margin: 0;
    padding: 0 0.15rem;
    font-size: clamp(0.3rem, 2vw, 0.42rem);
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ธีม TEXT: พรีวิวขนาดพอดี + แผงพิมพ์ข้อความต้องไม่ถูกตัด */
  .ff-split--text-theme {
    grid-template-rows: auto minmax(0, 1fr) minmax(3rem, 20dvh) auto;
  }

  .ff-split-preview--text .ff-card-block--preview {
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: clamp(0.06rem, 0.45dvh, 0.1rem);
  }

  .ff-split-preview--text .ff-card-label {
    flex-shrink: 0;
  }

  .ff-split-preview--text .ff-stack-wrap {
    flex: 0 0 auto;
    align-self: center;
    width: 100%;
    height: min(34dvh, 56vw);
    min-height: min(28dvh, 46vw);
    max-height: min(38dvh, 62vw);
    container-type: size;
  }

  .ff-split-preview--text .ff-stack-wrap .ff-stack {
    width: min(100cqw, 100cqh, 100%);
    height: min(100cqw, 100cqh, 100%);
    max-width: 100%;
    max-height: 100%;
  }

  .ff-split-preview--text .ff-text-frame-panel {
    flex: 1 1 auto;
    min-height: min(10.5rem, 32dvh);
    max-height: none;
    margin-top: 0;
    padding: 0.38rem 0.42rem 0.34rem;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .ff-split-preview--text .ff-text-frame-panel__subtitle,
  .ff-split-preview--text .ff-text-frame-panel__hint {
    display: none;
  }

  .ff-split-preview--text .ff-text-frame-panel__head {
    margin-bottom: 0.22rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__title {
    font-size: clamp(0.56rem, 2.8vw, 0.66rem);
  }

  .ff-split-preview--text .ff-text-frame-panel__label {
    margin-bottom: 0.16rem;
    font-size: 0.5rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__input {
    padding: 0.32rem 0.4rem;
    font-size: 0.68rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__controls {
    flex-direction: column;
    gap: 0.28rem;
    margin-top: 0.28rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__control {
    flex: none;
    width: 100%;
    min-width: 0;
    gap: 0.25rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__size-label {
    flex-shrink: 0;
    font-size: 0.5rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__size-btns {
    flex-shrink: 0;
    flex-wrap: nowrap;
    gap: 0.18rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__size-btn {
    min-width: 1.75rem;
    padding: 0.24rem 0.3rem;
    font-size: 0.54rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__size-btn--reset {
    min-width: 2rem;
    font-size: 0.5rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__size-val {
    min-width: 2rem;
    font-size: 0.52rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__slider-label {
    margin-top: 0.22rem;
    font-size: 0.48rem;
  }

  .ff-split-preview--text .ff-text-frame-panel__slider {
    margin-top: 0.1rem;
  }
}

@media (max-width: 899px) and (max-height: 700px) {
  .ff-split {
    grid-template-rows: auto minmax(0, 1fr) minmax(3.75rem, 24dvh) auto;
    gap: clamp(0.03rem, 0.32dvh, 0.08rem);
  }

  .ff-split-preview--text .ff-stack-wrap {
    height: min(30dvh, 50vw);
    min-height: min(26dvh, 44vw);
    max-height: min(34dvh, 58vw);
  }

  .ff-split-preview--text .ff-text-frame-panel {
    min-height: min(9.5rem, 28dvh);
  }
}

@media (max-width: 899px) and (max-height: 580px) {
  .ff-split {
    grid-template-rows: auto minmax(0, 1fr) minmax(3.35rem, 21dvh) auto;
  }

  .ff-title {
    font-size: clamp(0.52rem, 2.8vw, 0.72rem);
  }

  .ff-step-chip {
    font-size: clamp(0.28rem, 2.1vw, 0.4rem);
  }
}

@media (min-width: 900px) {
  .ff-create-slot--mobile {
    display: none !important;
  }
}

.ff-card-block--themes .ff-card-label {
  flex-shrink: 0;
  margin-bottom: clamp(0.12rem, 0.35dvh, 0.2rem);
}

.ff-panel--preview {
  flex: 1 1 0;
  min-height: min-content;
  padding: 0.28rem 0.34rem 0.32rem;
  border-radius: 0.95rem;
  background: linear-gradient(
    155deg,
    rgba(239, 246, 255, 0.72) 0%,
    rgba(252, 231, 243, 0.42) 55%,
    rgba(254, 249, 195, 0.2) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.ff-panel--side {
  min-height: 0;
  padding: 0.22rem 0.28rem 0.26rem;
  border-radius: 0.95rem;
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(224, 242, 254, 0.58) 50%,
    rgba(250, 232, 255, 0.48) 100%
  );
  border: 1px solid rgba(236, 72, 153, 0.22);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.55) inset;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}



.ff-stack-wrap {
  container-type: size;
  container-name: ffstack;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ff-stack-wrap--empty {
  cursor: pointer;
}
.ff-stack-wrap--empty:hover .ff-stack {
  box-shadow:
    inset 0 0 0 2px rgba(56, 189, 248, 0.4),
    inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}
.ff-stack-wrap--empty:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
  border-radius: 0.62rem;
}
.ff-stack-wrap--drag .ff-stack {
  box-shadow:
    inset 0 0 0 3px rgba(56, 189, 248, 0.55),
    inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.ff-card-block--actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ff-card-block--photo-top {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ff-card-label {
  margin: 0 0 clamp(0.22rem, 0.5dvh, 0.32rem);
  font-size: clamp(0.56rem, 0.32vw + 0.5rem, 0.78rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #1d4ed8;
}

.ff-card-label.ff-card-label--en {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: clamp(0.5rem, 0.26vw + 0.44rem, 0.68rem);
  font-weight: 800;
  color: #be185d;
}

/** แบ่งพื้นที่ Theme : Text = 38 : 10 (จาก 48 คอลัมน์) */
.ff-theme-groups {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 38fr) minmax(3.15rem, 10fr);
  align-items: stretch;
  gap: clamp(0.1rem, 0.45vw, 0.24rem);
}

.ff-theme-group {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.ff-theme-group--photo {
  grid-column: 1;
}

.ff-theme-group--text {
  grid-column: 2;
  padding-left: clamp(0.06rem, 0.3vw, 0.12rem);
  border-left: 2px dashed rgba(236, 72, 153, 0.35);
}

.ff-theme-group__label {
  flex-shrink: 0;
  margin: 0 0 clamp(0.12rem, 0.35dvh, 0.2rem);
  text-align: center;
}

.ff-theme-group__label--text {
  color: #7c3aed;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: clamp(0.46rem, 0.24vw + 0.4rem, 0.62rem);
}

.ff-theme-row {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: grid;
  gap: clamp(0.06rem, 0.35vw, 0.2rem);
  align-content: stretch;
  align-items: stretch;
}

.ff-theme-row--photo {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
}

.ff-theme-row--text {
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: minmax(0, 1fr);
  align-content: stretch;
}

.ff-theme-opt--text {
  background: linear-gradient(180deg, rgba(250, 245, 255, 0.9), rgba(252, 231, 243, 0.75));
}

.ff-theme-opt--text.ff-theme-opt--active {
  border-color: #a855f7;
  background: linear-gradient(180deg, rgba(243, 232, 255, 0.95), rgba(252, 231, 243, 0.85));
  box-shadow:
    0 0 0 1px rgba(168, 85, 247, 0.45),
    0 6px 16px -8px rgba(168, 85, 247, 0.35);
}

.ff-theme-row::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

@media (max-width: 899px) {
  /* กริดธีมในกรอบคงที่ — รูปย่อตามพื้นที่ ไม่เลื่อนหน้า */
  .ff-theme-groups {
    gap: clamp(0.06rem, 0.35dvw, 0.12rem);
    grid-template-columns: minmax(0, 38fr) minmax(3.15rem, 10fr);
  }

  .ff-theme-group--text {
    overflow: visible;
    min-width: 0;
  }

  .ff-theme-group__label--text {
    font-size: clamp(0.36rem, 2.2vw, 0.48rem);
    letter-spacing: 0.04em;
    padding: 0 0.04rem;
  }

  .ff-theme-group--text .ff-theme-opt__name {
    font-size: clamp(0.28rem, 1.6vw, 0.38rem);
    line-clamp: 1;
    -webkit-line-clamp: 1;
  }

  .ff-theme-group--text .ff-theme-opt__badge {
    font-size: clamp(0.2rem, 1.1vw, 0.28rem);
    padding: 0.04rem 0.2rem;
  }

  .ff-split-themes .ff-theme-row--photo {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    overflow: hidden;
    gap: clamp(0.02rem, 0.28dvh, 0.06rem);
    align-content: stretch;
  }

  .ff-split-themes .ff-theme-row--text {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    gap: clamp(0.04rem, 0.32dvh, 0.08rem);
  }

  .ff-split-themes .ff-theme-opt {
    height: 100%;
    min-height: 0;
    align-self: stretch;
    grid-template-rows: minmax(0, 1fr) auto;
    padding: clamp(0.02rem, 0.2dvh, 0.05rem) 0.02rem clamp(0.03rem, 0.25dvh, 0.06rem);
    gap: 0;
    border-width: 1.5px;
    border-radius: 0.32rem;
  }

  .ff-split-themes .ff-theme-opt__thumb-slot {
    container-type: size;
    container-name: fftheme;
    min-height: 0;
    height: 100%;
    max-height: 100%;
  }

  .ff-split-themes .ff-theme-opt__thumb {
    width: min(100%, 100cqmin);
    height: min(100%, 100cqmin);
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1;
  }

  .ff-split-themes .ff-theme-opt__name {
    font-size: clamp(0.3rem, 1.85vw, 0.42rem);
    line-height: 1.08;
    min-height: 1.1em;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

.ff-theme-opt {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  gap: 0.02rem;
  padding: clamp(0.02rem, 0.3dvh, 0.08rem) 0.03rem clamp(0.04rem, 0.2dvh, 0.1rem);
  margin: 0;
  border: 2px solid transparent;
  border-radius: 0.45rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(239, 246, 255, 0.58));
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.12s ease;
  animation: ff-pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.ff-theme-opt:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(96, 165, 250, 0.45);
}
.ff-theme-opt--active {
  border-color: #eab308;
  background: linear-gradient(180deg, rgba(254, 252, 232, 0.78), rgba(254, 243, 199, 0.62));
  box-shadow:
    0 0 0 1px rgba(234, 179, 8, 0.45),
    0 6px 16px -8px rgba(234, 179, 8, 0.28);
}

.ff-theme-opt__thumb-slot {
  position: relative;
  grid-row: 1;
  width: 100%;
  min-height: 0;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: size;
  container-name: fftheme;
}

.ff-theme-opt__badge {
  position: absolute;
  left: 50%;
  bottom: 0.12rem;
  z-index: 2;
  transform: translateX(-50%);
  padding: 0.06rem 0.28rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #db2777);
  color: #fff;
  font-size: clamp(0.22rem, 1.2vw, 0.34rem);
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
  pointer-events: none;
}

.ff-theme-opt__thumb {
  position: relative;
  display: block;
  flex: none;
  min-width: 0;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 1;
  height: auto;
  max-height: 100%;
  border-radius: 0.32rem;
  overflow: hidden;
  background: linear-gradient(145deg, #dbeafe, #fce7f3);
}

@supports (width: 1cqmin) {
  .ff-theme-opt__thumb {
    width: min(100%, 100cqmin);
    height: min(100%, 100cqmin);
    max-width: 100%;
    max-height: 100%;
  }
}

.ff-theme-opt__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ff-theme-opt__name {
  grid-row: 2;
  flex-shrink: 0;
  font-size: clamp(0.32rem, 0.14vw + 0.3rem, 0.48rem);
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  line-height: 1.08;
  width: 100%;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  hyphens: auto;
}
@media (min-width: 640px) {
  .ff-theme-opt__name {
    font-size: clamp(0.36rem, 0.12vw + 0.34rem, 0.52rem);
  }
}

.ff-stack {
  position: relative;
  isolation: isolate;
  flex: 0 0 auto;
  margin-inline: auto;
  border-radius: 0.55rem;
  overflow: hidden;
  background: linear-gradient(160deg, #dbeafe 0%, #e0e7ff 45%, #fce7f3 100%);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.15);
  width: min(100%, calc(100dvh - 11.25rem));
  max-width: 100%;
  aspect-ratio: 1;
  height: auto;
}

@supports (width: 1cqw) {
  .ff-stack-wrap .ff-stack {
    /* ใช้ cqw อย่าใช้ cqmin — ถ้าความสูง container ยังเป็น 0 ระหว่างคำนวณ cqmin จะเป็น 0 ทำให้ความกว้างเป็น 0 พรีวิวหาย */
    width: min(100cqw, 100%);
    max-width: 100%;
    height: auto;
    max-height: none;
  }
}

/* เดสก์ท็อป: พรีวิวสี่เหลี่ยมจัตุรัสพอดีช่อง (ไม่ให้สูงเกินแล้วถูก clip) */
@media (min-width: 900px) {
  .ff-theme-groups {
    grid-template-columns: minmax(0, 34fr) minmax(5.25rem, 14fr);
  }

  .ff-theme-group--text {
    overflow: visible;
  }

  .ff-theme-row--text {
    grid-auto-rows: auto;
    align-content: start;
    align-items: start;
    overflow: visible;
  }

  .ff-theme-group--text .ff-theme-opt {
    height: auto;
    grid-template-rows: auto auto;
    align-self: stretch;
  }

  .ff-theme-group--text .ff-theme-opt__thumb-slot {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    flex: 0 0 auto;
    container-type: normal;
  }

  .ff-theme-group--text .ff-theme-opt__thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    max-width: 100%;
    max-height: none;
  }

  .ff-theme-group--text .ff-theme-opt__thumb img {
    object-fit: contain;
  }

  .ff-card-block--preview .ff-stack-wrap {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ff-stack-wrap .ff-stack {
    width: min(100cqw, 100cqh, 100%);
    height: min(100cqw, 100cqh, 100%);
    max-width: 100%;
    max-height: 100%;
    min-width: 0;
    min-height: 0;
    aspect-ratio: 1;
    margin-inline: auto;
  }

  .ff-split-preview--text .ff-card-block--preview {
    min-height: 0;
  }

  .ff-split-preview--text .ff-stack-wrap {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    max-height: none;
  }

  .ff-split-preview--text .ff-text-frame-panel {
    flex: 0 1 auto;
    min-height: 0;
    max-height: min(42dvh, 22rem);
    overflow-y: auto;
  }
}

/* มือถือ: พรีวิวสี่เหลี่ยมจัตุรัสพอดีช่อง flex (ไม่ล้นจอ) */
@media (max-width: 899px) {
  .ff-stack-wrap .ff-stack {
    width: min(100cqw, 100cqh, 100%);
    height: min(100cqw, 100cqh, 100%);
    max-width: 100%;
    max-height: 100%;
    min-width: 0;
    min-height: 0;
    aspect-ratio: 1;
    margin-inline: auto;
  }

  .ff-stack-placeholder {
    font-size: clamp(0.42rem, 2.4vw, 0.52rem);
    padding: 0.25rem;
  }

  .ff-stack-placeholder-sub {
    margin-top: 0.12rem;
    font-size: clamp(0.36rem, 2vw, 0.44rem);
  }
}

.ff-stack--has-photo {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.ff-photo-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* allow rotate knob just below the uploaded image (still clipped by .ff-stack overflow) */
  overflow: visible;
}

.ff-photo-mover {
  position: absolute;
  left: 50%;
  top: 50%;
  cursor: grab;
  touch-action: none;
  will-change: transform;
  transform-origin: center center;
}

.ff-photo-mover__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: center center;
}
.ff-photo-mover--drag {
  cursor: grabbing;
}
.ff-photo-mover--resizing {
  cursor: nwse-resize;
}
.ff-photo-mover--rotating {
  cursor: grabbing;
}

.ff-photo-mover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

.ff-photo-hud {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.ff-photo-hud__frame {
  position: absolute;
  inset: 2px;
  border: 1.5px dashed rgba(255, 255, 255, 0.92);
  border-radius: 3px;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.35),
    inset 0 0 12px rgba(56, 189, 248, 0.12);
}

.ff-photo-hud__grip {
  position: absolute;
  width: 11px;
  height: 11px;
  border: 2px solid #fff;
  background: linear-gradient(145deg, #38bdf8, #6366f1);
  border-radius: 3px;
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.35);
  pointer-events: none;
}
.ff-photo-hud__grip--tl {
  top: -5px;
  left: -5px;
}
.ff-photo-hud__grip--tr {
  top: -5px;
  right: -5px;
}
.ff-photo-hud__grip--bl {
  bottom: -5px;
  left: -5px;
}

.ff-photo-hud__handle {
  position: absolute;
  right: -9px;
  bottom: -9px;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 5px;
  background: linear-gradient(145deg, #f472b6, #f59e0b);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
  pointer-events: auto;
  cursor: nwse-resize;
  touch-action: none;
  z-index: 3;
}

/** ปุ่มหมุนแบบลาก — ใต้กรอบรูปที่อัปโหลด (หมุนไปกับรูป) ไม่ใช่ใต้เฟรมทั้งแผ่น */
.ff-photo-mover-rotate {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 28px;
  height: 28px;
  margin-top: 0.38rem;
  margin-left: -14px;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 9999px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.35);
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  z-index: 5;
}
.ff-photo-mover-rotate:hover {
  filter: brightness(1.06);
}
.ff-photo-mover-rotate:active {
  cursor: grabbing;
}
.ff-photo-mover-rotate::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: inherit;
  border: 2px dashed rgba(255, 255, 255, 0.85);
  border-top-color: transparent;
  opacity: 0.95;
}
.ff-photo-hud__handle::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-right: 2px solid rgba(255, 255, 255, 0.95);
  border-bottom: 2px solid rgba(255, 255, 255, 0.95);
  border-radius: 0 0 2px 0;
  opacity: 0.95;
}
.ff-photo-hud__handle:hover {
  filter: brightness(1.06);
}

.ff-adjust-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.18rem;
  margin-top: 0.18rem;
}

.ff-adjust-hint {
  font-size: clamp(0.48rem, 0.28vw + 0.42rem, 0.62rem);
  font-weight: 700;
  color: #1d4ed8;
  text-align: center;
  line-height: 1.35;
}

.ff-adjust-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.ff-adjust-btns--rotate {
  flex-wrap: wrap;
  gap: 0.28rem;
}

.ff-adjust-btn {
  min-width: 1.65rem;
  padding: 0.18rem 0.38rem;
  border-radius: 0.4rem;
  border: 1px solid rgba(59, 130, 246, 0.45);
  background: rgba(255, 255, 255, 0.92);
  font-size: 0.65rem;
  font-weight: 800;
  color: #1e40af;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}
.ff-adjust-btn:hover {
  background: #eff6ff;
  border-color: #ec4899;
}
.ff-adjust-btn-wide {
  min-width: auto;
  padding-inline: 0.55rem;
  font-size: 0.5rem;
  font-weight: 800;
}

.ff-adjust-btn-narrow {
  min-width: 1.35rem;
  padding-inline: 0.22rem;
  font-size: 0.48rem;
}

.ff-stack-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  font-size: clamp(0.54rem, 0.35vw + 0.48rem, 0.68rem);
  font-weight: 700;
  color: #1d4ed8;
  background: linear-gradient(160deg, #eff6ff, #fdf2f8);
  z-index: 3;
}

.ff-stack-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.58rem;
  font-weight: 700;
  color: #1e40af;
  background: linear-gradient(160deg, #eff6ff, #fce7f3);
  z-index: 0;
  pointer-events: none;
}

.ff-stack-placeholder-sub {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.52rem;
  font-weight: 600;
  color: #be185d;
  line-height: 1.35;
}

.ff-stack-frame {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.ff-stack-text {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 5%;
  pointer-events: none;
  overflow: hidden;
}

.ff-stack-text--empty {
  outline: 2px dashed rgba(236, 72, 153, 0.55);
  outline-offset: -3px;
  border-radius: 999px;
  animation: ff-text-slot-pulse 1.8s ease-in-out infinite;
}

.ff-stack-text__label {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0;
  font-family: Kanit, Prompt, sans-serif;
  font-weight: 800;
  line-height: 1.12;
  color: #111827;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ff-stack-text__label--ghost {
  color: rgba(30, 64, 175, 0.42);
  font-style: italic;
}

.ff-text-frame-panel {
  position: relative;
  margin-top: 0.55rem;
  padding: 0.62rem 0.68rem 0.58rem;
  border-radius: 0.72rem;
  border: 2px solid transparent;
  background:
    linear-gradient(160deg, rgba(239, 246, 255, 0.98), rgba(252, 231, 243, 0.92)) padding-box,
    linear-gradient(120deg, #3b82f6, #ec4899, #eab308) border-box;
  box-shadow:
    0 6px 20px rgba(30, 64, 175, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.ff-text-frame-panel--pulse {
  animation: ff-text-panel-glow 2.2s ease-in-out infinite;
}

.ff-text-frame-panel__head {
  display: flex;
  align-items: flex-start;
  gap: 0.42rem;
  margin-bottom: 0.42rem;
}

.ff-text-frame-panel__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: linear-gradient(145deg, #fef08a, #fbcfe8);
  font-size: 0.72rem;
  line-height: 1;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.35);
}

.ff-text-frame-panel__head-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.ff-text-frame-panel__title {
  font-size: 0.68rem;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1.2;
}

.ff-text-frame-panel__subtitle {
  font-size: 0.54rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.3;
}

.ff-text-frame-panel__label {
  display: block;
  margin-bottom: 0.28rem;
  font-size: 0.62rem;
  font-weight: 700;
  color: #1e3a8a;
}

.ff-text-frame-panel__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.48rem 0.55rem;
  border-radius: 0.5rem;
  border: 2px solid rgba(236, 72, 153, 0.45);
  background: #fff;
  font-family: Kanit, Prompt, sans-serif;
  font-size: 0.78rem;
  font-weight: 800;
  color: #111827;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.12);
}

.ff-text-frame-panel__input:focus {
  outline: 2px solid rgba(236, 72, 153, 0.45);
  outline-offset: 1px;
  border-color: #ec4899;
}

.ff-text-frame-panel__controls {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  margin-top: 0.4rem;
}

.ff-text-frame-panel__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.ff-text-frame-panel__slider-label {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.52rem;
  font-weight: 700;
  color: #475569;
}

.ff-text-frame-panel__slider {
  width: 100%;
  margin-top: 0.2rem;
  accent-color: #ec4899;
  cursor: pointer;
}

.ff-text-frame-panel__size-label {
  font-size: 0.56rem;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
}

.ff-text-frame-panel__size-btns {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  margin-left: auto;
}

.ff-text-frame-panel__size-btn--reset {
  min-width: 2.35rem;
  font-size: 0.54rem;
}

.ff-text-frame-panel__size-btn {
  min-width: 2.1rem;
  padding: 0.28rem 0.42rem;
  border-radius: 0.38rem;
  border: 1px solid rgba(30, 64, 175, 0.35);
  background: #fff;
  font-family: Kanit, Prompt, sans-serif;
  font-size: 0.62rem;
  font-weight: 800;
  color: #1e3a8a;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.ff-text-frame-panel__size-btn:hover:not(:disabled) {
  border-color: #ec4899;
  background: #fdf2f8;
}

.ff-text-frame-panel__size-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ff-text-frame-panel__size-val {
  min-width: 2.4rem;
  font-size: 0.58rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
}

.ff-text-frame-panel__hint {
  margin: 0.32rem 0 0;
  font-size: 0.52rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.35;
}

.ff-photo-dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.22rem, 1vw, 0.4rem);
  min-width: 0;
}

.ff-photo-dual__col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ff-photo-dual__col--active .ff-drop-compact,
.ff-photo-dual__col--active.ff-photo-stage--compact {
  border-color: #ec4899;
  box-shadow: 0 0 0 1px rgba(236, 72, 153, 0.35);
}

.ff-photo-dual__col--locked .ff-drop-compact--locked {
  border-color: rgba(124, 58, 237, 0.5);
  background: linear-gradient(160deg, rgba(238, 242, 255, 0.82), rgba(252, 231, 243, 0.62));
}

.ff-drop-compact--dual {
  min-height: 2.75rem;
  height: 100%;
  width: 100%;
}

.ff-drop-compact--dual.ff-drop-compact--row {
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
  gap: 0.32rem;
  padding: 0.34rem 0.42rem;
}

.ff-photo-dual .ff-drop-compact--row .ff-drop-compact-text {
  align-items: flex-start;
  text-align: left;
}

.ff-drop-compact--ai .ff-drop-compact-ico--ai {
  color: #7c3aed;
  font-size: 1rem;
  line-height: 1;
}

.ff-drop-compact-line2--lock {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.12rem;
  color: #6d28d9;
}

.ff-lock-ico {
  width: 0.62rem;
  height: 0.62rem;
  flex-shrink: 0;
}

.ff-drop-compact--busy {
  cursor: wait;
  opacity: 0.85;
}

.ff-photo-stage--compact {
  flex: 1;
  min-height: 2.75rem;
  padding: 0.2rem;
  border-radius: 0.45rem;
  border: 2px dashed rgba(59, 130, 246, 0.35);
  background: rgba(255, 255, 255, 0.52);
}

.ff-photo-stage--compact .ff-photo-stage__thumb {
  width: clamp(2rem, 10vw, 2.6rem);
  height: clamp(2rem, 10vw, 2.6rem);
}

.ff-photo-stage--compact .ff-photo-stage__actions {
  justify-content: center;
}

.ff-photo-stage--compact .ff-btn-anime {
  min-width: 0;
  font-size: clamp(0.4rem, 2.2vw, 0.52rem);
  padding: 0.12rem 0.28rem;
}

.ff-drop-compact {
  display: flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.28rem 0.38rem;
  border-radius: 0.45rem;
  border: 2px dashed rgba(59, 130, 246, 0.45);
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}
.ff-drop-compact--on {
  border-color: #ec4899;
  background: rgba(252, 231, 243, 0.68);
}

.ff-drop-compact--prominent {
  min-height: 2.75rem;
  padding: 0.34rem 0.48rem;
  border-width: 2px;
  box-shadow: 0 2px 12px rgba(236, 72, 153, 0.12);
}

.ff-drop-compact-ico {
  flex-shrink: 0;
  color: #2563eb;
  display: flex;
}
.ff-cam-svg-sm {
  width: 1.15rem;
  height: 1.15rem;
}

.ff-drop-compact-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
  text-align: left;
}
.ff-drop-compact-line1 {
  font-size: clamp(0.52rem, 0.25vw + 0.48rem, 0.68rem);
  font-weight: 700;
  color: #1e3a8a;
}
.ff-drop-compact-line2 {
  font-size: clamp(0.46rem, 0.2vw + 0.42rem, 0.58rem);
  color: #db2777;
}

.ff-btn-gen-compact {
  width: 100%;
  padding: clamp(0.34rem, 0.75dvh, 0.48rem) clamp(0.5rem, 1.2vw, 0.75rem);
  font-size: clamp(0.68rem, 0.45vw + 0.58rem, 0.92rem);
  border-radius: 0.45rem;
}

.ff-hint {
  margin: 0;
  font-size: clamp(0.52rem, 0.25vw + 0.46rem, 0.66rem);
  color: #b45309;
  text-align: center;
}
.ff-hint--info {
  color: #0f766e;
}
.ff-hint--ok {
  color: #047857;
  font-weight: 700;
}

.ff-photo-stage {
  display: flex;
  flex-direction: column;
  gap: clamp(0.08rem, 0.5dvh, 0.14rem);
  margin-top: clamp(0.04rem, 0.35dvh, 0.1rem);
}

.ff-photo-stage__row {
  display: flex;
  align-items: center;
  gap: clamp(0.2rem, 1.2vw, 0.35rem);
}

.ff-photo-stage__thumb {
  width: clamp(2.6rem, 14vw, 3.4rem);
  height: clamp(2.6rem, 14vw, 3.4rem);
  object-fit: cover;
  border-radius: 0.45rem;
  border: 2px solid rgba(59, 130, 246, 0.35);
  background: #fff;
  flex-shrink: 0;
}

.ff-photo-stage__badge {
  font-size: clamp(0.38rem, 2.2vw, 0.5rem);
  font-weight: 800;
  color: #1d4ed8;
  padding: 0.12rem 0.28rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(252, 231, 243, 0.9));
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.ff-photo-stage__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: clamp(0.12rem, 0.8vw, 0.22rem);
}

.ff-btn-anime {
  flex: 1 1 auto;
  min-width: min(100%, 9rem);
  padding: clamp(0.14rem, 0.9dvh, 0.22rem) clamp(0.28rem, 2vw, 0.42rem);
  border: none;
  border-radius: 0.42rem;
  font-size: clamp(0.44rem, 2.6vw, 0.58rem);
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #4f46e5, #7c3aed, #db2777);
  box-shadow: 0 2px 10px rgba(79, 70, 229, 0.28);
  cursor: pointer;
  transition:
    transform 0.12s ease,
    opacity 0.12s ease;
}
.ff-btn-anime:not(:disabled):hover {
  transform: translateY(-1px);
}
.ff-btn-anime:disabled:not(.ff-btn-anime--loading) {
  opacity: 0.55;
  cursor: not-allowed;
}
.ff-btn-anime--loading {
  position: relative;
  overflow: hidden;
  opacity: 1;
  cursor: wait;
  background: linear-gradient(
    90deg,
    #4f46e5 0%,
    #7c3aed 22%,
    #db2777 44%,
    #f472b6 66%,
    #7c3aed 88%,
    #4f46e5 100%
  );
  background-size: 220% 100%;
  animation: ff-anime-gradient-run 1.6s linear infinite;
  box-shadow: 0 2px 14px rgba(124, 58, 237, 0.45);
}
.ff-btn-anime__loading {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 1.1em;
  z-index: 1;
}
.ff-btn-anime__shimmer {
  position: absolute;
  inset: -2px -40%;
  background: linear-gradient(
    105deg,
    transparent 38%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 62%
  );
  animation: ff-anime-shimmer-run 1.1s ease-in-out infinite;
  pointer-events: none;
}
.ff-btn-anime__label {
  position: relative;
  z-index: 1;
  letter-spacing: 0.02em;
}
@keyframes ff-anime-gradient-run {
  to {
    background-position: 220% center;
  }
}
@keyframes ff-anime-shimmer-run {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}
.ff-btn-anime--ghost {
  flex: 0 1 auto;
  min-width: 0;
  color: #1e40af;
  background: rgba(255, 255, 255, 0.82);
  border: 1.5px solid rgba(59, 130, 246, 0.4);
  box-shadow: none;
  font-weight: 600;
}

.ff-err {
  margin: 0;
  font-size: clamp(0.52rem, 0.25vw + 0.46rem, 0.66rem);
  color: #dc2626;
  text-align: center;
  line-height: 1.3;
}

.ff-foot {
  flex-shrink: 0;
  margin: 0.04rem 0 0;
  text-align: center;
  font-size: clamp(0.44rem, 0.22vw + 0.4rem, 0.58rem);
  font-weight: 700;
  color: #1e40af;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

@media (max-height: 560px) {
  .ff-split-photo,
  .ff-split-themes {
    gap: 0.2rem;
  }
  .ff-card-block--actions {
    gap: 0.24rem;
  }
  .ff-card-block--photo-top {
    gap: 0.24rem;
  }
  .ff-adjust-bar {
    margin-top: 0.22rem;
    gap: 0.2rem;
  }
}

.ff-result-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(239, 246, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.ff-result-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  max-height: calc(100dvh - 2rem);
}

.ff-result-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: #0f172a;
}

.ff-result-img-wrap {
  display: block;
  border-radius: 0.55rem;
  overflow: hidden;
  max-width: min(100%, 38dvh);
  max-height: min(38dvh, calc(100dvh - 10rem));
  box-shadow: 0 8px 28px rgba(236, 72, 153, 0.22), 0 4px 16px rgba(37, 99, 235, 0.12);
}

.ff-result-img {
  display: block;
  max-width: 100%;
  max-height: min(38dvh, calc(100dvh - 10rem));
  width: auto;
  height: auto;
  object-fit: contain;
  background: linear-gradient(145deg, #eff6ff, #fdf2f8);
}

.ff-result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: center;
}

.ff-result-hint {
  margin: 0.15rem 0 0;
  max-width: 22rem;
  padding: 0 0.35rem;
  text-align: center;
  font-size: clamp(0.48rem, 0.22vw + 0.42rem, 0.62rem);
  font-weight: 600;
  line-height: 1.45;
  color: #334155;
}

.ff-btn-secondary {
  padding: 0.45rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s ease;
}
.ff-btn-secondary:hover {
  background: #f8fafc;
}

/* Blobs — subtle; page uses BGFS artwork */
.ff-blob {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.12;
  pointer-events: none;
  animation: ff-float 16s ease-in-out infinite;
}
.ff-blob--a {
  width: 260px;
  height: 260px;
  background: #fda4af;
  top: -70px;
  left: -80px;
}
.ff-blob--b {
  width: 300px;
  height: 300px;
  background: #c4b5fd;
  bottom: -40px;
  right: -100px;
  animation-delay: -4s;
}
.ff-blob--c {
  width: 220px;
  height: 220px;
  background: #7dd3fc;
  top: 38%;
  left: 15%;
  opacity: 0.1;
  animation-delay: -7s;
}
@keyframes ff-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(24px, -16px) scale(1.06);
  }
  66% {
    transform: translate(-16px, 18px) scale(0.96);
  }
}

.ff-gradient-text {
  background: linear-gradient(115deg, #1d4ed8 0%, #db2777 36%, #ca8a04 68%, #2563eb 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ff-shimmer 8s linear infinite;
}
@keyframes ff-shimmer {
  to {
    background-position: 200% center;
  }
}

.ff-glass-pill {
  color: #1e3a8a;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(96, 165, 250, 0.55);
  box-shadow:
    0 2px 12px rgba(236, 72, 153, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.55) inset;
}

.ff-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ec4899;
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.35);
  animation: ff-pulse-dot 1.4s ease-in-out infinite;
}
@keyframes ff-pulse-dot {
  50% {
    transform: scale(1.15);
    opacity: 0.9;
  }
}

@keyframes ff-pop-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ff-btn-gen {
  font-weight: 600;
  background: linear-gradient(90deg, #2563eb, #ec4899, #facc15);
  background-size: 200% auto;
  color: #0f172a;
  border: none;
  box-shadow: 0 4px 18px rgba(236, 72, 153, 0.28);
  animation: ff-btn-gradient 3s linear infinite;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}
.ff-btn-gen:not(:disabled):hover {
  transform: scale(1.02);
  box-shadow: 0 6px 22px rgba(37, 99, 235, 0.28);
}
.ff-btn-gen:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
@keyframes ff-btn-gradient {
  to {
    background-position: 200% center;
  }
}

.ff-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(37, 99, 235, 0.2);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: ff-spin 0.65s linear infinite;
}
.ff-spinner--sm {
  width: 12px;
  height: 12px;
  border-width: 1.5px;
}
@keyframes ff-spin {
  to {
    transform: rotate(360deg);
  }
}

.ff-shake {
  animation: ff-shake 0.45s ease;
}
@keyframes ff-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.ff-btn-dl {
  padding: 0.45rem 1rem;
  font-size: 0.78rem;
  font-weight: 800;
  border-radius: 999px;
  background: #34d399;
  color: #0f172a;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(52, 211, 153, 0.35);
  transition: transform 0.15s ease;
}
.ff-btn-dl:hover {
  transform: scale(1.04);
}

.ff-fade-enter-active,
.ff-fade-leave-active {
  transition: opacity 0.3s ease;
}
.ff-fade-enter-from,
.ff-fade-leave-to {
  opacity: 0;
}
</style>
