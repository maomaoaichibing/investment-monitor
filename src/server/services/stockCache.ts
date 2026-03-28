/**
 * 股票行情缓存层
 * 减少重复API调用，60秒TTL
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL = 60 * 1000 // 60秒

/**
 * 获取缓存
 */
export function getCache<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }

  return entry.data
}

/**
 * 设置缓存
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 删除缓存
 */
export function deleteCache(key: string): void {
  cache.delete(key)
}

/**
 * 清空所有缓存
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * 生成缓存key
 */
export function makeCacheKey(symbol: string, market: string): string {
  return `stock:${symbol}:${market.toUpperCase()}`
}

/**
 * 获取批量缓存（只返回未过期的）
 */
export function getBatchCache<T>(
  items: Array<{ symbol: string; market: string }>,
  ttl: number = DEFAULT_TTL
): Record<string, T | null> {
  const result: Record<string, T | null> = {}

  for (const item of items) {
    const key = makeCacheKey(item.symbol, item.market)
    result[item.symbol] = getCache<T>(key, ttl)
  }

  return result
}

/**
 * 批量设置缓存
 */
export function setBatchCache<T>(items: Array<{ symbol: string; market: string; data: T }>): void {
  for (const item of items) {
    const key = makeCacheKey(item.symbol, item.market)
    setCache(key, item.data)
  }
}

/**
 * 缓存统计
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}
