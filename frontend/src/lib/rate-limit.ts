interface Tracker {
  count: number
  resetAt: number
}

const trackerMap = new Map<string, Tracker>()

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '127.0.0.1'
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const tracker = trackerMap.get(key)

  if (!tracker || tracker.resetAt <= now) {
    trackerMap.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (tracker.count >= limit) {
    const retryAfter = Math.ceil((tracker.resetAt - now) / 1000)
    return { ok: false, remaining: 0, retryAfter }
  }

  tracker.count += 1
  return { ok: true, remaining: limit - tracker.count, retryAfter: 0 }
}
