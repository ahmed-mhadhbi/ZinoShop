export const parseDateValue = (value: unknown): Date | null => {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === 'object') {
    const timestampLike = value as {
      toDate?: () => Date
      _seconds?: number
      seconds?: number
      _nanoseconds?: number
      nanoseconds?: number
    }

    if (typeof timestampLike.toDate === 'function') {
      const parsed = timestampLike.toDate()
      return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null
    }

    const seconds = Number(timestampLike._seconds ?? timestampLike.seconds)
    const nanoseconds = Number(timestampLike._nanoseconds ?? timestampLike.nanoseconds ?? 0)
    if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) {
      const parsed = new Date(Math.floor(seconds * 1000 + nanoseconds / 1_000_000))
      return isNaN(parsed.getTime()) ? null : parsed
    }
  }

  return null
}
