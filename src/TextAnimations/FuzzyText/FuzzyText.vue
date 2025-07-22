<!--
	Installed from https://vue-bits.dev/ui/
-->

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

interface FuzzyTextProps {
  text: string
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  color?: string
  enableHover?: boolean
  baseIntensity?: number
  hoverIntensity?: number
}

const props = withDefaults(defineProps<FuzzyTextProps>(), {
  text: '',
  fontSize: 'clamp(2rem, 8vw, 8rem)',
  fontWeight: 900,
  fontFamily: 'inherit',
  color: '#fff',
  enableHover: true,
  baseIntensity: 0.18,
  hoverIntensity: 0.5,
})

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')
let animationFrameId: number
let isCancelled = false
let cleanup: (() => void) | null = null

const waitForFont = async (fontFamily: string, fontWeight: string | number, fontSize: string): Promise<boolean> => {
  if (document.fonts?.check) {
    const fontString = `${fontWeight} ${fontSize} ${fontFamily}`

    if (document.fonts.check(fontString)) {
      return true
    }

    try {
      await document.fonts.load(fontString)
      return document.fonts.check(fontString)
    } catch (error) {
      console.warn('Font loading failed:', error)
      return false
    }
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      resolve(false)
      return
    }

    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`
    const testWidth = ctx.measureText('M').width

    let attempts = 0
    const checkFont = () => {
      ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`
      const newWidth = ctx.measureText('M').width

      if (newWidth !== testWidth && newWidth > 0) {
        resolve(true)
      } else if (attempts < 20) {
        attempts++
        setTimeout(checkFont, 50)
      } else {
        resolve(false)
      }
    }

    setTimeout(checkFont, 10)
  })
}

const initCanvas = async () => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  if (isCancelled) return

  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const computedFontFamily =
    props.fontFamily === 'inherit' ? window.getComputedStyle(canvas).fontFamily || 'sans-serif' : props.fontFamily

  const fontSizeStr = typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize
  let numericFontSize: number

  if (typeof props.fontSize === 'number') {
    numericFontSize = props.fontSize
  } else {
    const temp = document.createElement('span')
    temp.style.fontSize = props.fontSize
    temp.style.fontFamily = computedFontFamily
    document.body.appendChild(temp)
    const computedSize = window.getComputedStyle(temp).fontSize
    numericFontSize = parseFloat(computedSize)
    document.body.removeChild(temp)
  }

  const fontLoaded = await waitForFont(computedFontFamily, props.fontWeight, fontSizeStr)
  if (!fontLoaded) {
    console.warn(`Font not loaded: ${computedFontFamily}`)
  }

  const text = props.text

  const offscreen = document.createElement('canvas')
  const offCtx = offscreen.getContext('2d')
  if (!offCtx) return

  const fontString = `${props.fontWeight} ${fontSizeStr} ${computedFontFamily}`
  offCtx.font = fontString

  const testMetrics = offCtx.measureText('M')
  if (testMetrics.width === 0) {
    setTimeout(() => {
      if (!isCancelled) {
        initCanvas()
      }
    }, 100)
    return
  }

  offCtx.textBaseline = 'alphabetic'
  const metrics = offCtx.measureText(text)

  const actualLeft = metrics.actualBoundingBoxLeft ?? 0
  const actualRight = metrics.actualBoundingBoxRight ?? metrics.width
  const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize
  const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2

  const textBoundingWidth = Math.ceil(actualLeft + actualRight)
  const tightHeight = Math.ceil(actualAscent + actualDescent)

  const extraWidthBuffer = 10
  const offscreenWidth = textBoundingWidth + extraWidthBuffer

  offscreen.width = offscreenWidth
  offscreen.height = tightHeight

  const xOffset = extraWidthBuffer / 2
  offCtx.font = `${props.fontWeight} ${fontSizeStr} ${computedFontFamily}`
  offCtx.textBaseline = 'alphabetic'
  offCtx.fillStyle = props.color
  offCtx.fillText(text, xOffset - actualLeft, actualAscent)

  const horizontalMargin = 50
  const verticalMargin = 0
  canvas.width = offscreenWidth + horizontalMargin * 2
  canvas.height = tightHeight + verticalMargin * 2
  ctx.translate(horizontalMargin, verticalMargin)

  const interactiveLeft = horizontalMargin + xOffset
  const interactiveTop = verticalMargin
  const interactiveRight = interactiveLeft + textBoundingWidth
  const interactiveBottom = interactiveTop + tightHeight

  let isHovering = false
  const fuzzRange = 30

  const run = () => {
    if (isCancelled) return
    ctx.clearRect(-fuzzRange, -fuzzRange, offscreenWidth + 2 * fuzzRange, tightHeight + 2 * fuzzRange)
    const intensity = isHovering ? props.hoverIntensity : props.baseIntensity
    for (let j = 0; j < tightHeight; j++) {
      const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange)
      ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1)
    }
    animationFrameId = window.requestAnimationFrame(run)
  }

  run()

  const isInsideTextArea = (x: number, y: number) =>
    x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom

  const handleMouseMove = (e: MouseEvent) => {
    if (!props.enableHover) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    isHovering = isInsideTextArea(x, y)
  }

  const handleMouseLeave = () => {
    isHovering = false
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!props.enableHover) return
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    if (touch) {
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      isHovering = isInsideTextArea(x, y)
    }
  }

  const handleTouchEnd = () => {
    isHovering = false
  }

  if (props.enableHover) {
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)
  }

  cleanup = () => {
    window.cancelAnimationFrame(animationFrameId)
    if (props.enableHover) {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }
}

onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})

onUnmounted(() => {
  isCancelled = true
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }
  if (cleanup) {
    cleanup()
  }
})

watch(
  [
    () => props.text,
    () => props.fontSize,
    () => props.fontWeight,
    () => props.fontFamily,
    () => props.color,
    () => props.enableHover,
    () => props.baseIntensity,
    () => props.hoverIntensity,
  ],
  () => {
    isCancelled = true
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
    }
    if (cleanup) {
      cleanup()
    }
    isCancelled = false
    nextTick(() => {
      initCanvas()
    })
  },
)
</script>

<template>
  <canvas ref="canvasRef" />
</template>
