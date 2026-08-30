export interface Location {
  lat: number
  lon: number
  city?: string
  country?: string
  address?: string
}

/**
 * 计算两个位置之间的距离（米）
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const earthRadius = 6_371_000
  const lat1 = toRadians(loc1.lat)
  const lat2 = toRadians(loc2.lat)
  const deltaLat = toRadians(loc2.lat - loc1.lat)
  const deltaLon = toRadians(loc2.lon - loc1.lon)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * 计算位置匹配度（0-100）
 * @param taskLoc 任务位置
 * @param humanLoc 专家位置
 * @param maxDistance 最大距离（米），默认10公里
 */
export function calculateLocationMatch(
  taskLoc: Location,
  humanLoc: Location,
  maxDistance: number = 10000
): number {
  const distance = calculateDistance(taskLoc, humanLoc)
  const score = Math.max(0, 100 - (distance / maxDistance) * 100)
  return Math.round(score)
}

/**
 * 检查位置是否在范围内
 */
export function isWithinRange(
  taskLoc: Location,
  humanLoc: Location,
  maxDistance: number
): boolean {
  return calculateDistance(taskLoc, humanLoc) <= maxDistance
}

/**
 * 格式化位置字符串
 */
export function formatLocation(location: Location): string {
  if (location.address) return location.address
  if (location.city) return location.city
  return `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
}

/**
 * 计算中心点
 */
export function calculateCenter(locations: Location[]): Location {
  if (locations.length === 0) {
    throw new Error('Cannot calculate center of empty array')
  }

  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.lat,
      lon: acc.lon + loc.lon,
    }),
    { lat: 0, lon: 0 }
  )

  return {
    lat: sum.lat / locations.length,
    lon: sum.lon / locations.length,
  }
}

/**
 * 查找最近的位置
 */
export function findNearestLocation(
  target: Location,
  candidates: Location[]
): Location | null {
  if (candidates.length === 0) return null

  return candidates.reduce((nearest, current) => {
    const targetDistance = calculateDistance(target, current)
    const nearestDistance = calculateDistance(target, nearest)
    return targetDistance < nearestDistance ? current : nearest
  })
}
