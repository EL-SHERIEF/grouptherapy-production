import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateTime(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "number") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value !== "string") return null

  const raw = value.trim()
  if (!raw) return null

  let normalized = raw

  if (normalized.includes(" ") && !normalized.includes("T")) {
    normalized = normalized.replace(" ", "T")
  }

  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, "$1:$2")
  normalized = normalized.replace(/([+-]\d{2})$/, "$1:00")

  const hasTimezone = /Z$/.test(normalized) || /[+-]\d{2}:\d{2}$/.test(normalized)
  if (!hasTimezone && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00:00Z`
  } else if (!hasTimezone) {
    normalized = `${normalized}Z`
  }

  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isEventPast(
  event: { date?: unknown; endDate?: unknown },
  now: Date = new Date(),
): boolean {
  const effectiveEnd = parseDateTime(event.endDate ?? event.date)
  if (!effectiveEnd) return false
  return effectiveEnd.getTime() < now.getTime()
}
