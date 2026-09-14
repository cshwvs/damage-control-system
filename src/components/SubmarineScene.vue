<template>
  <div ref="stageRef" class="sub-stage" :style="{ height: stageHeight }">
    <canvas ref="canvasRef" class="sub-canvas"></canvas>

    <!-- 视窗内 HUD 浮层 -->
    <div class="sub-overlay">
      <div class="ov-panel">
        <div class="ov-title"><span class="ov-dot"></span>{{ title }}</div>
        <div v-if="caption" class="ov-caption">{{ caption }}</div>
      </div>

      <div class="ov-metrics">
        <div class="ov-chip"><span class="chip-k">视距</span><span class="chip-v">{{ metrics.distance.toFixed(1) }} m</span></div>
        <div class="ov-chip"><span class="chip-k">横倾</span><span class="chip-v">{{ metrics.roll.toFixed(1) }}°</span></div>
        <div class="ov-chip"><span class="chip-k">纵倾</span><span class="chip-v">{{ metrics.pitch.toFixed(1) }}°</span></div>
        <div class="ov-chip"><span class="chip-k">深度</span><span class="chip-v">{{ depth }} m</span></div>
      </div>

      <div class="ov-hint">左键拖拽 360° 环绕 · 滚轮缩放 · 右键拖拽平移</div>

      <div class="ov-tools">
        <button type="button" class="ov-btn" :class="{ on: spinning }" @click="toggleSpin">自动巡航</button>
        <button type="button" class="ov-btn" @click="viewSide">侧视</button>
        <button type="button" class="ov-btn" @click="viewTop">俯视</button>
        <button type="button" class="ov-btn" @click="resetView">复位视角</button>
      </div>
    </div>

    <div v-if="!ready && !failure" class="sub-mask">深海三维场景载入中…</div>
    <div v-if="failure" class="sub-mask is-error">{{ failure }}</div>
  </div>
</template>

<script setup>
/**
 * xxx深海三维视窗（基于 three.js）
 * - 程序化生成xxx模型（艇体回转体 + 上层建筑 + 指挥台围壳 + 十字尾舵 + 七叶螺旋桨）
 * - 深海环境：水体渐变、雾气、水面透射光柱、海床礁石、上浮气泡与悬浮微粒
 * - 交互：左键拖拽 360° 环绕、滚轮缩放、右键拖拽平移，另提供自动巡航与预设视角
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  /** 视窗标题 */
  title: { type: String, default: 'xxx深海三维可视化' },
  /** 视窗副标题说明 */
  caption: { type: String, default: '' },
  /** 视窗高度，数字（px）或任意 CSS 长度 */
  height: { type: [Number, String], default: 560 },
  /** 显示深度（m） */
  depth: { type: [Number, String], default: 320 },
  /** 横倾角（°），驱动艇体横滚 */
  listAngle: { type: Number, default: 0 },
  /** 纵倾角（°），驱动艇体俯仰 */
  trimAngle: { type: Number, default: 0 },
  /** 气泡数量（少量） */
  bubbleCount: { type: Number, default: 90 },
  /** 初始是否自动巡航环绕 */
  autoRotate: { type: Boolean, default: false }
})

const stageRef = ref(null)
const canvasRef = ref(null)
const ready = ref(false)
const failure = ref('')
const spinning = ref(props.autoRotate)
const metrics = reactive({ distance: 0, roll: 0, pitch: 0 })

const stageHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height
)

/* ------------------------------------------------------------------ *
 * three.js 运行时对象（刻意不加响应式，避免 Vue 代理三维对象）
 * ------------------------------------------------------------------ */
const HOME_POS = new THREE.Vector3(14.5, 7, 18.5)
const HOME_TARGET = new THREE.Vector3(0, 0.8, 0)

let renderer = null
let scene = null
let camera = null
let controls = null
let lastFrameTime = 0
let elapsed = 0
let submarine = null
let propeller = null
let bubbleField = null
let snowField = null
let shaftMeshes = []
let envTarget = null
let backgroundTexture = null
let stageObserver = null
let camTween = null
let loopHandle = null

/* ------------------------------ 纹理 ------------------------------ */

function createSoftDotTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,0.95)')
  grad.addColorStop(0.35, 'rgba(198,238,255,0.55)')
  grad.addColorStop(0.72, 'rgba(130,205,240,0.16)')
  grad.addColorStop(1, 'rgba(120,200,240,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 水面透射光柱：顶部亮、向下渐隐 */
function createShaftTexture() {
  const w = 32
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(190,240,255,0.85)')
  grad.addColorStop(0.22, 'rgba(150,220,250,0.42)')
  grad.addColorStop(0.6, 'rgba(90,170,215,0.15)')
  grad.addColorStop(1, 'rgba(60,140,190,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  // 两侧收边，避免光柱出现硬直边
  const side = ctx.createLinearGradient(0, 0, w, 0)
  side.addColorStop(0, 'rgba(0,0,0,1)')
  side.addColorStop(0.35, 'rgba(0,0,0,0)')
  side.addColorStop(0.65, 'rgba(0,0,0,0)')
  side.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = side
  ctx.fillRect(0, 0, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 艇体消声瓦贴图 */
function createHullTileTexture() {
  const size = 256
  const cell = 16
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgb(58,80,99)'
  ctx.fillRect(0, 0, size, size)
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const v = 0.82 + Math.random() * 0.34
      const r = Math.round(68 * v)
      const g = Math.round(92 * v)
      const b = Math.round(112 * v)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
    }
  }
  ctx.strokeStyle = 'rgba(12,20,28,0.55)'
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += cell) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 4)
  tex.anisotropy = 4
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 深海环境渐变（等距柱状投影，同时用作背景与环境反射） */
function createSeaGradientTexture() {
  const W = 64
  const H = 32
  const data = new Uint8Array(W * H * 4)
  const abyss = [3, 9, 15]
  const mid = [8, 26, 40]
  const surface = [46, 106, 130]
  const sun = [156, 226, 240]
  const mix = (a, b, k) => [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k
  ]
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1) // 0 = 海底方向，1 = 水面方向
    let base
    if (v < 0.55) base = mix(abyss, mid, v / 0.55)
    else {
      const k = (v - 0.55) / 0.45
      base = mix(mid, surface, k * k)
    }
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1)
      const du = Math.min(Math.abs(u - 0.3), 1 - Math.abs(u - 0.3))
      const dv = Math.abs(v - 0.97)
      const glow = Math.max(0, 1 - (du / 0.24) ** 2) * Math.max(0, 1 - (dv / 0.3) ** 2)
      const c = mix(base, sun, glow * 0.85)
      const i = (y * W + x) * 4
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/* ---------------------------- 几何构造 ---------------------------- */

function roundedRectShape(width, height, radius) {
  const w = width / 2
  const h = height / 2
  const r = Math.min(radius, Math.min(w, h))
  const s = new THREE.Shape()
  s.moveTo(-w + r, -h)
  s.lineTo(w - r, -h)
  s.quadraticCurveTo(w, -h, w, -h + r)
  s.lineTo(w, h - r)
  s.quadraticCurveTo(w, h, w - r, h)
  s.lineTo(-w + r, h)
  s.quadraticCurveTo(-w, h, -w, h - r)
  s.lineTo(-w, -h + r)
  s.quadraticCurveTo(-w, -h, -w + r, -h)
  return s
}

/** 艇体：由型线回转生成，艏部朝 +Z，总长约 24 */
function buildHullGeometry() {
  const profile = [
    [0.0, -12.1],
    [0.5, -11.3],
    [1.05, -10.15],
    [1.6, -8.6],
    [2.05, -6.5],
    [2.26, -4.0],
    [2.32, -0.8],
    [2.32, 2.6],
    [2.26, 5.7],
    [2.08, 7.9],
    [1.76, 9.45],
    [1.28, 10.62],
    [0.66, 11.34],
    [0.0, 11.72]
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const points = new THREE.SplineCurve(profile)
    .getPoints(150)
    .map((p) => new THREE.Vector2(Math.max(p.x, 0.002), p.y))
  const geo = new THREE.LatheGeometry(points, 56)
  geo.rotateX(Math.PI / 2) // 回转轴 Y → Z
  return geo
}

/** 尾舵/艏舵剖面：前后对称的梯形翼，弦向 Z、厚度 X、展向 Y */
function buildFinGeometry() {
  const rootChord = 2.5
  const tipChord = 1.2
  const span = 2.5
  const shape = new THREE.Shape()
  shape.moveTo(-rootChord / 2, 0)
  shape.lineTo(rootChord / 2, 0)
  shape.lineTo(tipChord / 2, span)
  shape.lineTo(-tipChord / 2, span)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 1
  })
  geo.translate(0, 0, -0.08)
  geo.rotateY(-Math.PI / 2)
  return geo
}

/** 螺旋桨桨叶：从桨毂向 +X 伸展的叶形 */
function buildBladeGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0.24, 0.1)
  s.bezierCurveTo(0.62, 0.62, 1.22, 0.72, 1.58, 0.3)
  s.bezierCurveTo(1.66, 0.12, 1.4, -0.06, 1.05, -0.16)
  s.bezierCurveTo(0.72, -0.26, 0.36, -0.2, 0.24, 0.1)
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 8 })
  geo.translate(0, 0, -0.025)
  geo.scale(0.82, 0.82, 1)
  return geo
}

/* ---------------------------- 模型装配 ---------------------------- */

function buildSubmarine() {
  const group = new THREE.Group()

  const hullTexture = createHullTileTexture()
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: hullTexture,
    metalness: 0.42,
    roughness: 0.5,
    envMapIntensity: 0.8
  })
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1d2a36,
    metalness: 0.5,
    roughness: 0.55,
    envMapIntensity: 0.7
  })
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x93a1ad,
    metalness: 0.72,
    roughness: 0.34,
    envMapIntensity: 1.0
  })
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb08a4a,
    metalness: 0.78,
    roughness: 0.3,
    envMapIntensity: 1.1
  })
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x8ef0ff })
  const redMat = new THREE.MeshBasicMaterial({ color: 0xff5a4d })
  const greenMat = new THREE.MeshBasicMaterial({ color: 0x63f08c })

  // 艇体
  group.add(new THREE.Mesh(buildHullGeometry(), hullMat))

  // 上层建筑（甲板围板）
  const deckGeo = new THREE.ExtrudeGeometry(roundedRectShape(1.9, 0.7, 0.3), {
    depth: 13.4,
    bevelEnabled: true,
    bevelSize: 0.1,
    bevelThickness: 0.1,
    bevelSegments: 2,
    curveSegments: 8
  })
  deckGeo.translate(0, 2.35, -6.9)
  group.add(new THREE.Mesh(deckGeo, hullMat))

  // 指挥台围壳
  const sailGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.95, 2.6, 0.42), {
    depth: 4.4,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    bevelSegments: 2,
    curveSegments: 10
  })
  sailGeo.translate(0, 3.9, -2.4)
  group.add(new THREE.Mesh(sailGeo, hullMat))

  // 围壳舵
  const fairwaterGeo = new THREE.BoxGeometry(1.6, 0.14, 1.1)
  for (const sx of [-1, 1]) {
    const fin = new THREE.Mesh(fairwaterGeo, darkMat)
    fin.position.set(sx * 1.24, 3.45, -0.35)
    group.add(fin)
  }

  // 艏舵（水平舵，位于艏部水线附近）
  const bowPlaneGeo = buildFinGeometry()
  bowPlaneGeo.scale(0.5, 0.62, 0.72)
  for (const sx of [-1, 1]) {
    const fin = new THREE.Mesh(bowPlaneGeo, hullMat)
    fin.position.set(sx * 1.55, 0.05, 7.4)
    fin.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2
    group.add(fin)
  }

  // 十字尾舵（上下左右四片，同一几何绕轴旋转得到）
  const finGeo = buildFinGeometry()
  const finRotations = [
    [0, 0, 0],
    [Math.PI, 0, 0],
    [0, 0, -Math.PI / 2],
    [0, 0, Math.PI / 2]
  ]
  for (const rot of finRotations) {
    const fin = new THREE.Mesh(finGeo, hullMat)
    fin.rotation.set(rot[0], rot[1], rot[2])
    fin.position.z = -9.2
    group.add(fin)
  }

  // 推进轴与螺旋桨
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16), metalMat)
  shaft.rotation.x = Math.PI / 2
  shaft.position.z = -11.3
  group.add(shaft)

  const prop = new THREE.Group()
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.24, 0.95, 24), brassMat)
  hub.rotation.x = Math.PI / 2
  prop.add(hub)
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 20), brassMat)
  tailCone.rotation.x = -Math.PI / 2
  tailCone.position.z = -0.72
  prop.add(tailCone)
  const bladeGeo = buildBladeGeometry()
  const bladeCount = 7
  for (let i = 0; i < bladeCount; i++) {
    const pivot = new THREE.Group()
    pivot.rotation.z = (i / bladeCount) * Math.PI * 2
    const blade = new THREE.Mesh(bladeGeo, brassMat)
    blade.rotation.x = 0.42 // 桨叶螺距角
    pivot.add(blade)
    prop.add(pivot)
  }
  prop.position.z = -11.95
  group.add(prop)

  // 潜望镜与天线（立于围壳顶部 y=5.2）
  const masts = [
    { r: 0.075, h: 1.6, x: -0.16, z: -1.3, cap: true },
    { r: 0.05, h: 2.1, x: 0.14, z: -0.4, cap: false },
    { r: 0.12, h: 0.85, x: 0.02, z: 1.1, cap: true }
  ]
  for (const m of masts) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(m.r, m.r * 1.15, m.h, 14), metalMat)
    mast.position.set(m.x, 5.2 + m.h / 2, m.z)
    group.add(mast)
    if (m.cap) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(m.r * 1.25, 12, 10), darkMat)
      cap.position.set(m.x, 5.2 + m.h + m.r * 0.6, m.z)
      group.add(cap)
    }
  }

  // 围壳舷窗与航行灯
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const port = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), glowMat)
      port.position.set(sx * 0.545, 4.15, 0.55 - i * 0.6)
      group.add(port)
    }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), sx > 0 ? greenMat : redMat)
    lamp.position.set(sx * 0.55, 4.85, -1.1)
    group.add(lamp)
  }

  // 随艇补光，保证抵近观察时艏艉均可见
  const fill = new THREE.PointLight(0x7fd8ff, 1.0, 0, 0)
  fill.position.set(3.5, 3.5, 5)
  group.add(fill)

  return { group, propeller: prop }
}

/* ---------------------------- 环境元素 ---------------------------- */

function spawnBubble(initial) {
  const angle = Math.random() * Math.PI * 2
  const radius = 2.5 + Math.pow(Math.random(), 0.6) * 16
  const baseX = Math.cos(angle) * radius
  const baseZ = Math.sin(angle) * radius * 0.75
  return {
    baseX,
    baseZ,
    y: initial ? -15 + Math.random() * 30 : -15 - Math.random() * 4,
    speed: 0.5 + Math.random() * 1.1,
    sway: 0.3 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
    top: 14 + Math.random() * 6
  }
}

function buildBubbles(count) {
  const positions = new Float32Array(count * 3)
  const items = []
  for (let i = 0; i < count; i++) {
    const b = spawnBubble(true)
    items.push(b)
    positions[i * 3] = b.baseX
    positions[i * 3 + 1] = b.y
    positions[i * 3 + 2] = b.baseZ
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.42,
    map: createSoftDotTexture(),
    color: 0xc6ecff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return { points, items, positions, geo }
}

function updateBubbles(dt, t) {
  if (!bubbleField) return
  const { items, positions, geo } = bubbleField
  for (let i = 0; i < items.length; i++) {
    let b = items[i]
    b.y += b.speed * dt
    if (b.y > b.top) {
      b = spawnBubble(false)
      items[i] = b
    }
    positions[i * 3] = b.baseX + Math.sin(t * b.sway + b.phase) * 0.5
    positions[i * 3 + 1] = b.y
    positions[i * 3 + 2] = b.baseZ + Math.cos(t * b.sway * 0.85 + b.phase) * 0.4
  }
  geo.attributes.position.needsUpdate = true
}

/** 深海悬浮微粒（海雪） */
function buildMarineSnow(count) {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 70
    positions[i * 3 + 1] = -22 + Math.random() * 46
    positions[i * 3 + 2] = (Math.random() - 0.5) * 70
    speeds[i] = 0.06 + Math.random() * 0.16
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.11,
    map: createSoftDotTexture(),
    color: 0xa9d6ea,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    sizeAttenuation: true
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  return { points, positions, speeds, geo }
}

function updateSnow(dt) {
  if (!snowField) return
  const { positions, speeds, geo } = snowField
  for (let i = 0; i < speeds.length; i++) {
    let y = positions[i * 3 + 1] - speeds[i] * dt
    if (y < -24) y = 24
    positions[i * 3 + 1] = y
  }
  geo.attributes.position.needsUpdate = true
}

/** 水面透射光柱 */
function buildLightShafts() {
  const texture = createShaftTexture()
  const meshes = []
  for (let i = 0; i < 7; i++) {
    const width = 5 + Math.random() * 8
    const geo = new THREE.PlaneGeometry(width, 72)
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.1 + Math.random() * 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set((Math.random() - 0.5) * 48, 13, (Math.random() - 0.5) * 48)
    mesh.rotation.y = Math.random() * Math.PI
    mesh.rotation.z = (Math.random() - 0.5) * 0.18
    mesh.renderOrder = -1
    meshes.push(mesh)
  }
  return meshes
}

/** 海床与礁石 */
function buildSeabed() {
  const group = new THREE.Group()
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0b1a24,
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.4
  })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -28
  group.add(floor)

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x14262f,
    roughness: 0.95,
    metalness: 0.05,
    envMapIntensity: 0.35
  })
  const rockGeo = new THREE.IcosahedronGeometry(1, 0)
  for (let i = 0; i < 16; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat)
    const scale = 1.2 + Math.random() * 3.4
    rock.scale.set(scale * (0.8 + Math.random() * 0.6), scale * (0.5 + Math.random() * 0.5), scale)
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    const angle = Math.random() * Math.PI * 2
    const radius = 16 + Math.random() * 55
    rock.position.set(Math.cos(angle) * radius, -28 + scale * 0.35, Math.sin(angle) * radius)
    group.add(rock)
  }
  return group
}

/* ---------------------------- 场景初始化 ---------------------------- */

function initScene() {
  const stage = stageRef.value
  const canvas = canvasRef.value
  const width = stage.clientWidth || 900
  const height = stage.clientHeight || 560

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x04121c, 0.019)

  backgroundTexture = createSeaGradientTexture()
  scene.background = backgroundTexture
  scene.backgroundIntensity = 0.9
  try {
    const pmrem = new THREE.PMREMGenerator(renderer)
    envTarget = pmrem.fromEquirectangular(backgroundTexture)
    scene.environment = envTarget.texture
    pmrem.dispose()
  } catch (err) {
    // 环境反射不可用时，仅依靠灯光照明
  }

  camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 400)
  camera.position.copy(HOME_POS)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  controls.rotateSpeed = 0.85
  controls.zoomSpeed = 0.9
  controls.panSpeed = 0.85
  controls.screenSpacePanning = true
  controls.minDistance = 6
  controls.maxDistance = 95
  controls.minPolarAngle = Math.PI * 0.06
  controls.maxPolarAngle = Math.PI * 0.88
  controls.autoRotateSpeed = 0.62
  controls.autoRotate = spinning.value
  controls.target.copy(HOME_TARGET)
  controls.update()

  // 灯光：水面透射光 + 正面海水散射 + 背侧轮廓光 + 深海底部冷光
  scene.add(new THREE.HemisphereLight(0x5aa9cf, 0x08161f, 1.25))
  const sunLight = new THREE.DirectionalLight(0xcdefff, 2.8)
  sunLight.position.set(10, 32, 12)
  scene.add(sunLight)
  const fillLight = new THREE.DirectionalLight(0x2b6f9c, 1.0)
  fillLight.position.set(16, 2, 18)
  scene.add(fillLight)
  const rimLight = new THREE.PointLight(0x76e4ff, 3.0, 0, 0)
  rimLight.position.set(-15, 7, -13)
  scene.add(rimLight)
  const deepLight = new THREE.PointLight(0x2b5cff, 1.8, 0, 0)
  deepLight.position.set(-10, -10, -8)
  scene.add(deepLight)

  // 环境
  scene.add(buildSeabed())
  for (const shaft of buildLightShafts()) {
    scene.add(shaft)
    shaftMeshes.push(shaft)
  }

  // 悬浮微粒与气泡
  snowField = buildMarineSnow(320)
  scene.add(snowField.points)
  bubbleField = buildBubbles(Math.max(20, Math.round(props.bubbleCount)))
  scene.add(bubbleField.points)

  // xxx
  const built = buildSubmarine()
  submarine = built.group
  propeller = built.propeller
  scene.add(submarine)

  lastFrameTime = performance.now()
  elapsed = 0
  loopHandle = renderer.setAnimationLoop(renderLoop)
  if (typeof ResizeObserver !== 'undefined') {
    stageObserver = new ResizeObserver(handleResize)
    stageObserver.observe(stage)
  }
  handleResize()
}

function handleResize() {
  const stage = stageRef.value
  if (!stage || !renderer || !camera) return
  const width = stage.clientWidth
  const height = stage.clientHeight
  if (!width || !height) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
}

function renderLoop() {
  if (!renderer || !scene || !camera) return
  const now = performance.now()
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05)
  lastFrameTime = now
  elapsed += dt
  const t = elapsed

  // 气泡上浮、微粒下沉、光柱呼吸
  updateBubbles(dt, t)
  updateSnow(dt)
  for (let i = 0; i < shaftMeshes.length; i++) {
    const mat = shaftMeshes[i].material
    mat.opacity = 0.11 + Math.sin(t * 0.35 + i * 1.7) * 0.035
  }

  // 艇体姿态与悬浮起伏
  if (submarine) {
    const targetRoll = THREE.MathUtils.degToRad(props.listAngle || 0)
    const targetPitch = THREE.MathUtils.degToRad(props.trimAngle || 0)
    const k = Math.min(1, dt * 2.2)
    submarine.rotation.z += (targetRoll - submarine.rotation.z) * k
    submarine.rotation.x += (targetPitch - submarine.rotation.x) * k
    submarine.position.y = Math.sin(t * 0.5) * 0.18

    const roll = THREE.MathUtils.radToDeg(submarine.rotation.z)
    const pitch = THREE.MathUtils.radToDeg(submarine.rotation.x)
    if (Math.abs(roll - metrics.roll) > 0.05) metrics.roll = Number(roll.toFixed(1))
    if (Math.abs(pitch - metrics.pitch) > 0.05) metrics.pitch = Number(pitch.toFixed(1))
  }
  if (propeller) propeller.rotation.z += dt * 1.35

  // 视角补间
  if (camTween) {
    camTween.t += dt
    const k = Math.min(1, camTween.t / camTween.duration)
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e)
    controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e)
    if (k >= 1) camTween = null
  }

  controls.update()

  const distance = camera.position.distanceTo(controls.target)
  if (Math.abs(distance - metrics.distance) > 0.05) metrics.distance = Number(distance.toFixed(1))

  renderer.render(scene, camera)
  if (!ready.value) ready.value = true
}

/* ---------------------------- 交互动作 ---------------------------- */

function flyTo(position, target, duration = 0.8) {
  if (!camera || !controls) return
  camTween = {
    fromPos: camera.position.clone(),
    toPos: position.clone(),
    fromTarget: controls.target.clone(),
    toTarget: target.clone(),
    t: 0,
    duration
  }
}

function toggleSpin() {
  spinning.value = !spinning.value
  if (controls) controls.autoRotate = spinning.value
}

function resetView() {
  flyTo(HOME_POS, HOME_TARGET)
}

function viewSide() {
  flyTo(new THREE.Vector3(33, 2.5, 0.2), new THREE.Vector3(0, 0.5, 0), 0.7)
}

function viewTop() {
  flyTo(new THREE.Vector3(2, 29, 8), new THREE.Vector3(0, 0, 0), 0.7)
}

watch(
  () => props.autoRotate,
  (value) => {
    spinning.value = value
    if (controls) controls.autoRotate = value
  }
)

/* ---------------------------- 生命周期 ---------------------------- */

onMounted(() => {
  try {
    initScene()
  } catch (err) {
    failure.value = '当前浏览器无法初始化 WebGL 三维视窗，请使用支持 WebGL 的现代浏览器打开。'
    // eslint-disable-next-line no-console
    console.error('[SubmarineScene]', err)
  }
})

onBeforeUnmount(() => {
  if (renderer) renderer.setAnimationLoop(null)
  loopHandle = null
  if (stageObserver) {
    stageObserver.disconnect()
    stageObserver = null
  }
  if (controls) {
    controls.dispose()
    controls = null
  }
  if (envTarget) {
    envTarget.dispose()
    envTarget = null
  }
  if (backgroundTexture) {
    backgroundTexture.dispose()
    backgroundTexture = null
  }
  if (scene) {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      const material = obj.material
      if (!material) return
      const list = Array.isArray(material) ? material : [material]
      for (const mat of list) {
        for (const key of Object.keys(mat)) {
          const value = mat[key]
          if (value && value.isTexture) value.dispose()
        }
        mat.dispose()
      }
    })
    scene.clear()
    scene = null
  }
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  submarine = null
  propeller = null
  bubbleField = null
  snowField = null
  shaftMeshes = []
  camTween = null
  camera = null
})
</script>

<style scoped>
.sub-stage {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  background: radial-gradient(circle at 50% 20%, #08202e 0%, #030c14 62%, #01060b 100%);
  isolation: isolate;
}

.sub-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 四角装饰框，强化“观察窗”观感 */
.sub-stage::before,
.sub-stage::after {
  content: '';
  position: absolute;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(120, 220, 255, 0.45);
  pointer-events: none;
  z-index: 3;
}
.sub-stage::before {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}
.sub-stage::after {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

.sub-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  font-family: inherit;
}

.ov-panel {
  position: absolute;
  top: 18px;
  left: 20px;
  max-width: 46%;
  padding: 10px 14px;
  border-radius: 6px;
  background: linear-gradient(120deg, rgba(9, 28, 42, 0.82), rgba(9, 28, 42, 0.42));
  border: 1px solid rgba(110, 210, 245, 0.28);
  backdrop-filter: blur(3px);
}
.ov-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #d8f3ff;
}
.ov-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5fe0ff;
  box-shadow: 0 0 8px #5fe0ff;
  animation: ovPulse 2.2s ease-in-out infinite;
}
@keyframes ovPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.72); }
}
.ov-caption {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(186, 222, 240, 0.78);
}

.ov-metrics {
  position: absolute;
  top: 18px;
  right: 20px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 52%;
}
.ov-chip {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 4px;
  background: rgba(8, 26, 40, 0.72);
  border: 1px solid rgba(110, 210, 245, 0.22);
}
.chip-k {
  font-size: 11px;
  color: rgba(150, 200, 225, 0.8);
}
.chip-v {
  font-size: 13px;
  font-weight: 700;
  color: #7fe6ff;
  font-variant-numeric: tabular-nums;
}

.ov-hint {
  position: absolute;
  left: 20px;
  bottom: 18px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 11px;
  color: rgba(160, 205, 230, 0.75);
  background: rgba(6, 20, 32, 0.6);
  border: 1px solid rgba(110, 210, 245, 0.16);
}

.ov-tools {
  position: absolute;
  right: 20px;
  bottom: 18px;
  display: flex;
  gap: 8px;
  pointer-events: auto;
}
.ov-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-family: inherit;
  color: #bfe6f7;
  background: rgba(8, 26, 40, 0.78);
  border: 1px solid rgba(110, 210, 245, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.ov-btn:hover {
  color: #eafaff;
  border-color: rgba(120, 225, 255, 0.7);
  background: rgba(15, 46, 68, 0.9);
}
.ov-btn.on {
  color: #04202c;
  background: #6fe0ff;
  border-color: #6fe0ff;
  font-weight: 700;
}

.sub-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: rgba(175, 215, 235, 0.8);
  background: rgba(3, 12, 20, 0.72);
  letter-spacing: 1px;
}
.sub-mask.is-error {
  color: #ffd7d2;
  background: rgba(30, 8, 10, 0.82);
  padding: 0 40px;
  text-align: center;
  line-height: 1.7;
}
</style>
