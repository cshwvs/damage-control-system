<template>
  <div class="navbar" ref="navbarRef">
    <canvas ref="canvasRef" class="navbar-canvas"></canvas>
    <div class="breadcrumb-wrapper">
      <el-button
        type="text"
        class="breadcrumb-btn"
        :style="{ color: textColors[0] }"
        @click="goHome"
      >首页</el-button>

      <template v-for="(item, index) in breadcrumbs" :key="item.path">
        <span class="separator" :style="{ color: textColors[index + 1] }">/</span>
        <el-button
          type="text"
          class="breadcrumb-btn"
          :style="{ color: textColors[index + 1] }"
          :class="{ 'is-active': index === breadcrumbs.length - 1 }"
          @click="handleClick(item)"
        >{{ item.meta.title }}</el-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const navbarRef = ref(null)
const canvasRef = ref(null)
const textColors = ref(['#ffffff', '#ffffff'])

const breadcrumbs = computed(() => route.matched.filter(item => item.meta && item.meta.title))

function goHome() {
  router.push('/platform/parameters')
}

function handleClick(item) {
  if (item.path && item.path !== route.path) {
    router.push(item.path)
  }
}

let animationFrameId
let ctx
let width, height
let circles = []

// 初始化多层径向渐变圆（模拟弥散颜色团）
// 初始化多层径向渐变圆（模拟弥散颜色团）
function initCircles() {
  circles = []
  const count = 16  // 增加圆的数量
  for (let i = 0; i < count; i++) {
    circles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2.5,   // 速度加快
      vy: (Math.random() - 0.5) * 2.5,
      radius: 80 + Math.random() * 200,
      // 白色概率提高到 70%，海军蓝 30%，使整体白色占比增加
color: Math.random() > 0.3 ? '#ffffff' : '#142864',
      alpha: 0.15 + Math.random() * 0.25,
      pulse: 0.5 + Math.random() * 1.5,   // 脉动速率
      angle: Math.random() * Math.PI * 2
    })
  }
}

// 绘制弥散渐变背景（无生硬线条）
function drawBackground() {
  ctx.clearRect(0, 0, width, height)
  // 先铺一层非常淡的海军蓝作为基调，增强过渡感
  ctx.fillStyle = 'rgba(240, 244, 250, 0.3)'
  ctx.fillRect(0, 0, width, height)

  // 绘制多个径向渐变圆，它们相互融合形成水乳交融效果
  circles.forEach(circle => {
    const currentRadius = circle.radius + Math.sin(Date.now() * 0.002 * circle.pulse) * 10
    const gradient = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, currentRadius)
    if (circle.color === '#142864') {
      gradient.addColorStop(0, `rgba(20, 40, 100, ${circle.alpha})`)
      gradient.addColorStop(1, 'rgba(20, 40, 100, 0)')
    } else {
      gradient.addColorStop(0, `rgba(255, 255, 255, ${circle.alpha})`)
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    }
    circle.x += circle.vx
    circle.y += circle.vy  
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2)
    ctx.fill()

    // 更新位置
    circle.x += circle.vx
    circle.y += circle.vy
    if (circle.x < -circle.radius) circle.x = width + circle.radius
    if (circle.x > width + circle.radius) circle.x = -circle.radius
    if (circle.y < -circle.radius) circle.y = height + circle.radius
    if (circle.y > height + circle.radius) circle.y = -circle.radius
  })
}

// 采样元素中心位置背景颜色，返回反色
// 海军蓝基准色 (深色)
// 颜色常量
const NAVY = { r: 20, g: 40, b: 100 }
const WHITE = { r: 255, g: 255, b: 255 }
const NAVY_LUM = 0.2126 * NAVY.r + 0.7152 * NAVY.g + 0.0722 * NAVY.b // ≈ 40

function sampleInverseColor(el) {
  if (!ctx || !el) return '#ffffff'
  const rect = el.getBoundingClientRect()
  const navbarRect = navbarRef.value.getBoundingClientRect()
  const x = Math.floor(rect.left + rect.width / 2 - navbarRect.left)
  const y = Math.floor(rect.top + rect.height / 2 - navbarRect.top)
  if (x < 0 || x >= width || y < 0 || y >= height) return '#ffffff'
  try {
    const pixel = ctx.getImageData(x, y, 1, 1).data
    // 计算背景亮度
    const lum = 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]
    // 背景中白色比例 t（0=纯海军蓝，1=纯白）
    const t = Math.max(0, Math.min(1, (lum - NAVY_LUM) / (255 - NAVY_LUM)))
    const tEnhanced = Math.pow(t, 0.1)
    // 文字颜色 = 白色*(1-t) + 海军蓝*t，确保背景越深文字越白，背景越白文字越深
    const r = Math.round(WHITE.r * (1 - tEnhanced) + NAVY.r * tEnhanced)
    const g = Math.round(WHITE.g * (1 - tEnhanced) + NAVY.g * tEnhanced)
    const b = Math.round(WHITE.b * (1 - tEnhanced) + NAVY.b * tEnhanced)
    return `rgb(${r},${g},${b})`
  } catch (e) {
    return '#ffffff'
  }
}

// 更新所有文字颜色
function updateTextColors() {
  if (!navbarRef.value) return
  const buttons = navbarRef.value.querySelectorAll('.breadcrumb-btn')
  const separators = navbarRef.value.querySelectorAll('.separator')
  const newColors = []
  buttons.forEach(btn => newColors.push(sampleInverseColor(btn)))
  separators.forEach(sep => newColors.push(sampleInverseColor(sep)))
  // 将颜色按模板顺序合并：首页按钮 + 每个面包屑项(分隔符+按钮)
  const finalColors = []
  if (buttons.length > 0) {
    finalColors.push(newColors[0]) // 首页按钮
    let btnIndex = 1
    let sepIndex = buttons.length // separators索引从buttons.length开始
    for (let i = 0; i < separators.length; i++) {
      finalColors.push(newColors[sepIndex]) // 分隔符
      finalColors.push(newColors[btnIndex]) // 按钮
      btnIndex++
      sepIndex++
    }
  }
  textColors.value = finalColors
}

// 动画循环
function animate() {
  drawBackground()
  updateTextColors()
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(async () => {
  await nextTick()
  const canvas = canvasRef.value
  const navbar = navbarRef.value
  if (!canvas || !navbar) return
  ctx = canvas.getContext('2d')
  width = navbar.clientWidth
  height = navbar.clientHeight
  canvas.width = width
  canvas.height = height
  initCircles()
  animationFrameId = requestAnimationFrame(animate)

  window.addEventListener('resize', () => {
    width = navbar.clientWidth
    height = navbar.clientHeight
    canvas.width = width
    canvas.height = height
    initCircles()
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.navbar {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
}

.navbar-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 允许点击穿透 */
}

.breadcrumb-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 1;
}

.breadcrumb-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  font-size: 16px; /* 增加2 */
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.breadcrumb-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.breadcrumb-btn.is-active {
  font-weight: 600;
  background: transparent;
}

.separator {
  margin: 0 2px;
  font-size: 16px;
}
</style>