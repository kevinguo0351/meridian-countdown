import { BufferGeometry, Float32BufferAttribute } from 'three'

export function createRingGeometry(radius: number, tube: number): BufferGeometry {
  const radial = 180
  const tubular = 18
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= radial; i += 1) {
    const u = (i / radial) * Math.PI * 2
    const cu = Math.cos(u)
    const su = Math.sin(u)
    for (let j = 0; j <= tubular; j += 1) {
      const v = (j / tubular) * Math.PI * 2
      const cv = Math.cos(v)
      const sv = Math.sin(v)
      positions.push((radius + tube * cv) * cu, tube * sv, (radius + tube * cv) * su)
      normals.push(cu * cv, sv, su * cv)
      uvs.push(i / radial, j / tubular)
    }
  }

  const row = tubular + 1
  for (let i = 0; i < radial; i += 1) {
    for (let j = 0; j < tubular; j += 1) {
      const a = i * row + j
      const b = a + row
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

export function createCrystalGeometry(): BufferGeometry {
  const sides = 6
  const topY = 1.42
  const botY = -0.78
  const upperY = 0.42
  const lowerY = -0.18
  const upperR = 0.34
  const lowerR = 0.46
  const positions: number[] = []
  const normals: number[] = []

  const upper: [number, number, number][] = []
  const lower: [number, number, number][] = []
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / 6
    upper.push([Math.cos(a) * upperR, upperY, Math.sin(a) * upperR])
    lower.push([Math.cos(a) * lowerR, lowerY, Math.sin(a) * lowerR])
  }
  const top: [number, number, number] = [0, topY, 0]
  const bot: [number, number, number] = [0, botY, 0]

  const push = (a: [number, number, number], b: [number, number, number], c: [number, number, number]) => {
    const ux = b[0] - a[0]
    const uy = b[1] - a[1]
    const uz = b[2] - a[2]
    const vx = c[0] - a[0]
    const vy = c[1] - a[1]
    const vz = c[2] - a[2]
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const len = Math.hypot(nx, ny, nz) || 1
    nx /= len
    ny /= len
    nz /= len
    for (const p of [a, b, c]) {
      positions.push(p[0], p[1], p[2])
      normals.push(nx, ny, nz)
    }
  }

  for (let i = 0; i < sides; i += 1) {
    const j = (i + 1) % sides
    push(top, upper[j], upper[i])
    push(upper[i], upper[j], lower[j])
    push(upper[i], lower[j], lower[i])
    push(bot, lower[i], lower[j])
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  return geometry
}
