import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  NoToneMapping,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three'
import { PROGRESS_WINDOW_MS } from '../types.ts'
import { createCrystalGeometry, createRingGeometry } from './geometry.ts'
import {
  backgroundFragment,
  backgroundVertex,
  crystalFragment,
  glassFragment,
  glassVertex,
  particleFragment,
  particleVertex,
} from './shaders.ts'

export type LiveState = {
  target: number
  done: boolean[]
  count: number
  themeHex: string
  reducedMotion: boolean
  pointerX: number
  pointerY: number
  pulseKick: number
}

export type SceneHandle = {
  capture: () => HTMLCanvasElement
  dispose: () => void
}

const RING_RADII = [0.7, 1.02, 1.36, 1.72, 2.12]
const RING_TUBES = [0.034, 0.03, 0.026, 0.023, 0.02]
const RING_OFFSETS = [0.85, -1.05, 0.7, -0.92, 0.58]
const TILT = Math.PI / 2 - 0.58

type Framing = {
  y: number
  z: number
  lookY: number
  rigY: number
  fov: number
}

const PORTRAIT: Framing = { y: 0.02, z: 7.35, lookY: 0.62, rigY: 0.28, fov: 30 }
const LANDSCAPE: Framing = { y: 0.22, z: 8.5, lookY: 0.32, rigY: 0.05, fov: 26 }

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function makeGlowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = LinearSRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  if (!ctx) return texture
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,250,240,0.95)')
  gradient.addColorStop(0.22, 'rgba(255,236,205,0.4)')
  gradient.addColorStop(1, 'rgba(255,236,205,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  texture.needsUpdate = true
  return texture
}

function makeParticles(): { points: Points; geometry: BufferGeometry; material: ShaderMaterial } {
  const count = 110
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const radius = 0.15 + Math.random() * 1.9
    const angle = Math.random() * Math.PI * 2
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.2) * 3.2
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.5
    seeds[i] = Math.random()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
  const material = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uFreeze: { value: 0 },
      uProgress: { value: 1 },
      uThemeColor: { value: new Color('#e0b15c') },
    },
  })
  material.toneMapped = false
  const points = new Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 0
  return { points, geometry, material }
}

export function mountScene(container: HTMLElement, live: LiveState): SceneHandle {
  const canvas = document.createElement('canvas')
  canvas.dataset.testid = 'meridian-canvas'
  container.appendChild(canvas)

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
    failIfMajorPerformanceCaveat: false,
  })
  renderer.outputColorSpace = LinearSRGBColorSpace
  renderer.toneMapping = NoToneMapping
  renderer.setClearColor(0x0b0c0e, 1)
  renderer.autoClear = false
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'

  const bgScene = new Scene()
  const bgCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const bgMaterial = new ShaderMaterial({
    vertexShader: backgroundVertex,
    fragmentShader: backgroundFragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 1 },
      uMilestoneRatio: { value: 0 },
      uThemeColor: { value: new Color(live.themeHex) },
      uPulse: { value: 0 },
    },
  })
  bgMaterial.toneMapped = false
  const bgMesh = new Mesh(new PlaneGeometry(2, 2), bgMaterial)
  bgMesh.frustumCulled = false
  bgScene.add(bgMesh)

  const scene = new Scene()
  const camera = new PerspectiveCamera(PORTRAIT.fov, 1, 0.1, 40)
  const rig = new Group()
  scene.add(rig)

  const themeColor = new Color(live.themeHex)
  const disposables: Array<BufferGeometry | Material | CanvasTexture> = [bgMesh.geometry, bgMaterial]

  const ringMaterials: ShaderMaterial[] = []
  const rings: Mesh[] = []
  RING_RADII.forEach((radius, index) => {
    const geometry = createRingGeometry(radius, RING_TUBES[index])
    const material = new ShaderMaterial({
      vertexShader: glassVertex,
      fragmentShader: glassFragment,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 1 },
        uAlign: { value: 0 },
        uThemeColor: { value: themeColor },
        uPulse: { value: 0 },
      },
    })
    material.toneMapped = false
    const mesh = new Mesh(geometry, material)
    mesh.rotation.order = 'YXZ'
    mesh.rotation.x = TILT
    mesh.renderOrder = index + 1
    rig.add(mesh)
    rings.push(mesh)
    ringMaterials.push(material)
    disposables.push(geometry, material)
  })

  const crystalMaterial = new ShaderMaterial({
    vertexShader: glassVertex,
    fragmentShader: crystalFragment,
    transparent: true,
    depthWrite: true,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 1 },
      uMilestoneRatio: { value: 0 },
      uThemeColor: { value: themeColor },
      uPulse: { value: 0 },
    },
  })
  crystalMaterial.toneMapped = false
  const crystalGeometry = createCrystalGeometry()
  const crystal = new Mesh(crystalGeometry, crystalMaterial)
  crystal.scale.setScalar(1.45)
  crystal.renderOrder = 8
  rig.add(crystal)
  disposables.push(crystalGeometry, crystalMaterial)

  const glowTexture = makeGlowTexture()
  const glowMaterial = new SpriteMaterial({
    map: glowTexture,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0.35,
    color: themeColor.clone(),
  })
  glowMaterial.toneMapped = false
  const glow = new Sprite(glowMaterial)
  glow.scale.set(1.55, 2.1, 1)
  glow.renderOrder = 7
  rig.add(glow)
  disposables.push(glowTexture, glowMaterial)

  const particles = makeParticles()
  rig.add(particles.points)
  disposables.push(particles.geometry, particles.material)

  const lookAt = new Vector3()
  let framing: Framing = { ...PORTRAIT }
  let capturing = false
  let running = true
  let raf = 0
  let time = 0
  let spin = 0
  let pulse = 0
  let ratio = 0
  let progress = 1
  let dolly = 0
  let parallaxX = 0
  let parallaxY = 0
  const align = RING_OFFSETS.map(() => 0)
  let last = performance.now()

  function applyFraming(next: Framing) {
    framing = next
    camera.fov = next.fov
  }

  function resize() {
    if (capturing) return
    const width = container.clientWidth
    const height = container.clientHeight
    if (width < 2 || height < 2) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(1, height)
    applyFraming(width / height < 0.92 ? PORTRAIT : LANDSCAPE)
    camera.updateProjectionMatrix()
  }

  function draw(dt: number) {
    const reduced = live.reducedMotion
    if (live.pulseKick > 0) {
      pulse = Math.max(pulse, live.pulseKick)
      dolly = Math.max(dolly, live.pulseKick)
      live.pulseKick = 0
    }

    const snap = reduced ? 80 : 2.4
    const doneCount = live.done.slice(0, live.count).filter(Boolean).length
    const targetRatio = live.count > 0 ? doneCount / live.count : 0
    const left = Math.max(0, live.target - Date.now())
    const targetProgress = Math.min(1, left / PROGRESS_WINDOW_MS)
    ratio = damp(ratio, targetRatio, reduced ? 80 : 2.1, dt)
    progress = damp(progress, targetProgress, snap, dt)
    pulse = damp(pulse, 0, reduced ? 80 : 1.35, dt)
    dolly = damp(dolly, 0, reduced ? 80 : 2.2, dt)
    parallaxX = damp(parallaxX, reduced ? 0 : live.pointerX, snap, dt)
    parallaxY = damp(parallaxY, reduced ? 0 : live.pointerY, snap, dt)

    if (!reduced) {
      time += dt
      spin += dt * 0.045
    }

    themeColor.set(live.themeHex)
    bgMaterial.uniforms.uTime.value = time
    bgMaterial.uniforms.uProgress.value = progress
    bgMaterial.uniforms.uMilestoneRatio.value = ratio
    ;(bgMaterial.uniforms.uThemeColor.value as Color).copy(themeColor)
    bgMaterial.uniforms.uPulse.value = pulse

    for (let i = 0; i < rings.length; i += 1) {
      const targetAlign = i < live.count && live.done[i] ? 1 : 0
      align[i] = damp(align[i], targetAlign, reduced ? 80 : 2.7, dt)
      const mesh = rings[i]
      mesh.visible = i < Math.max(1, live.count)
      mesh.rotation.x = TILT + RING_OFFSETS[i] * 0.08 * (1 - align[i])
      mesh.rotation.y = spin * 0.35 + RING_OFFSETS[i] * (1 - align[i])
      const material = ringMaterials[i]
      material.uniforms.uTime.value = time
      material.uniforms.uProgress.value = progress
      material.uniforms.uAlign.value = align[i]
      material.uniforms.uPulse.value = pulse
    }

    const crystalY = -0.62 + ratio * 2.15
    crystal.position.y = crystalY
    glow.position.y = crystalY + 0.18
    crystalMaterial.uniforms.uTime.value = time
    crystalMaterial.uniforms.uProgress.value = progress
    crystalMaterial.uniforms.uMilestoneRatio.value = ratio
    crystalMaterial.uniforms.uPulse.value = pulse
    glowMaterial.color.copy(themeColor)
    glowMaterial.opacity = 0.2 + ratio * 0.4 + pulse * 0.5
    glow.scale.set(1.35 + ratio * 0.5 + pulse * 0.4, 1.9 + ratio * 0.7 + pulse * 0.45, 1)

    particles.material.uniforms.uTime.value = time
    particles.material.uniforms.uFreeze.value = reduced ? 1 : 0
    particles.material.uniforms.uProgress.value = progress
    ;(particles.material.uniforms.uThemeColor.value as Color).copy(themeColor)

    rig.position.y = framing.rigY
    rig.rotation.y = parallaxX * 0.08
    rig.rotation.x = parallaxY * -0.045
    camera.position.set(
      parallaxX * 0.18,
      framing.y + parallaxY * 0.08,
      framing.z - dolly * 0.28,
    )
    lookAt.set(0, framing.lookY, 0)
    camera.lookAt(lookAt)

    renderer.clear()
    renderer.render(bgScene, bgCamera)
    renderer.clearDepth()
    renderer.render(scene, camera)
  }

  function loop(now: number) {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!capturing) draw(dt || 0.016)
    raf = requestAnimationFrame(loop)
  }

  const resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(container)

  const onVisibility = () => {
    if (document.hidden) {
      running = false
      cancelAnimationFrame(raf)
      return
    }
    if (!running) {
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  resize()
  draw(0.016)
  raf = requestAnimationFrame(loop)

  return {
    capture() {
      capturing = true
      const width = Math.max(2, container.clientWidth)
      const height = Math.max(2, container.clientHeight)
      const previousRatio = renderer.getPixelRatio()
      try {
        renderer.setPixelRatio(1)
        applyFraming(PORTRAIT)
        renderer.setSize(1170, 2532, false)
        camera.aspect = 1170 / 2532
        camera.updateProjectionMatrix()
        draw(0.016)
        const snapshot = document.createElement('canvas')
        snapshot.width = 1170
        snapshot.height = 2532
        const ctx = snapshot.getContext('2d')
        ctx?.drawImage(renderer.domElement, 0, 0, 1170, 2532)
        return snapshot
      } finally {
        renderer.setPixelRatio(Math.min(previousRatio, 2))
        applyFraming(width / height < 0.92 ? PORTRAIT : LANDSCAPE)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        capturing = false
        draw(0.016)
      }
    },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const item of disposables) item.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
