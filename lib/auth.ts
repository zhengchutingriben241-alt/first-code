import { createHmac, createHash, timingSafeEqual } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export const BLOG_COOKIE_NAME = 'blog-auth'
export const ADMIN_COOKIE_NAME = 'admin-auth'
export const PASSWORD = process.env.BLOG_READER_PASSWORD || 'blog4me2026!'
export const COOKIE_SECRET = process.env.BLOG_AUTH_SECRET || PASSWORD
export const DATA_FOLDER = join(process.cwd(), 'data')
export const ADMIN_CONFIG_PATH = join(DATA_FOLDER, 'admin-config.json')
export const ADMIN_LOGIN_LOG_PATH = join(DATA_FOLDER, 'admin-login-logs.json')
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@example.com'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'
export const ADMIN_COOKIE_SECRET = process.env.ADMIN_AUTH_SECRET || ADMIN_PASSWORD
export const ADMIN_OTP_SECRET = process.env.ADMIN_OTP_SECRET || ADMIN_COOKIE_SECRET
export const MAX_AGE = 60 * 60 * 24
export const AUTH_DURATION_MS = MAX_AGE * 1000
export const OTP_EXPIRATION_MS = 10 * 60 * 1000
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const MAX_LOGIN_FAILURES = 5
export const LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000

type AdminConfig = {
  email: string
  passwordHash: string
  authSecret: string
  otpSecret: string
}

export type LoginLogEntry = {
  timestamp: string
  email: string
  ip: string
  method: 'password' | 'otp' | 'send-code' | 'blocked'
  success: boolean
  reason?: string
}

function ensureDataFolder() {
  if (!existsSync(DATA_FOLDER)) {
    mkdirSync(DATA_FOLDER, { recursive: true })
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) {
      return fallback
    }
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  ensureDataFolder()
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function getAdminConfig(): AdminConfig {
  const fromFile = readJsonFile<AdminConfig | null>(ADMIN_CONFIG_PATH, null)
  if (fromFile && fromFile.email && fromFile.passwordHash) {
    return fromFile
  }

  return {
    email: ADMIN_EMAIL,
    passwordHash: hashSecret(ADMIN_PASSWORD),
    authSecret: ADMIN_COOKIE_SECRET,
    otpSecret: ADMIN_OTP_SECRET,
  }
}

export function setAdminPassword(newPassword: string) {
  const currentConfig = getAdminConfig()
  const updatedConfig = {
    ...currentConfig,
    passwordHash: hashSecret(newPassword),
    authSecret: currentConfig.authSecret || ADMIN_COOKIE_SECRET,
    otpSecret: currentConfig.otpSecret || ADMIN_OTP_SECRET,
  }
  writeJsonFile(ADMIN_CONFIG_PATH, updatedConfig)
}

export function getAllAdminLoginLogs() {
  const logs = readJsonFile<LoginLogEntry[]>(ADMIN_LOGIN_LOG_PATH, [])
  return logs.slice().reverse()
}

export function getAdminLoginLogs(page = 1, pageSize = 20) {
  const allLogs = getAllAdminLoginLogs()
  const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20
  const start = (normalizedPage - 1) * normalizedPageSize
  const pagedLogs = allLogs.slice(start, start + normalizedPageSize)
  return {
    logs: pagedLogs,
    total: allLogs.length,
  }
}

export function recordAdminLoginLog(entry: LoginLogEntry) {
  const logs = readJsonFile<LoginLogEntry[]>(ADMIN_LOGIN_LOG_PATH, [])
  logs.push(entry)
  writeJsonFile(ADMIN_LOGIN_LOG_PATH, logs)
}

type RateLimitRecord = {
  attempts: number[]
  blockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) {
    return {}
  }

  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [name, ...rest] = cookie.trim().split('=')
      return [decodeURIComponent(name), decodeURIComponent(rest.join('='))]
    })
  )
}

function getTokenFromRequest(req: any, cookieName: string) {
  const cookieHeader = req.headers?.cookie
  const cookies = parseCookies(cookieHeader)
  return cookies[cookieName]
}

function hashSecret(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function getRateLimitRecord(key: string) {
  let record = rateLimitStore.get(key)
  if (!record) {
    record = { attempts: [] }
    rateLimitStore.set(key, record)
  }
  return record
}

function pruneRateLimitRecord(record: RateLimitRecord) {
  const now = Date.now()
  record.attempts = record.attempts.filter(timestamp => now - timestamp <= LOGIN_RATE_LIMIT_WINDOW_MS)
  if (record.blockedUntil && now > record.blockedUntil) {
    record.blockedUntil = undefined
    record.attempts = []
  }
}

export function getRateLimitStatus(key: string) {
  const record = getRateLimitRecord(key)
  pruneRateLimitRecord(record)
  const now = Date.now()
  return {
    blocked: Boolean(record.blockedUntil && now < record.blockedUntil),
    remainingMs: record.blockedUntil && now < record.blockedUntil ? record.blockedUntil - now : 0,
    failures: record.attempts.length,
  }
}

export function recordRateLimitFailure(key: string) {
  const record = getRateLimitRecord(key)
  pruneRateLimitRecord(record)
  record.attempts.push(Date.now())
  if (record.attempts.length >= MAX_LOGIN_FAILURES) {
    record.blockedUntil = Date.now() + LOGIN_BLOCK_DURATION_MS
  }
}

export function clearRateLimitFailures(key: string) {
  rateLimitStore.delete(key)
}

export function validatePassword(password: string) {
  return timingSafeEqual(Buffer.from(hashSecret(password)), Buffer.from(hashSecret(PASSWORD)))
}

export function createAuthToken() {
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', COOKIE_SECRET)
    .update(`${PASSWORD}:${timestamp}`)
    .digest('hex')
  return `${timestamp}:${signature}`
}

export function validateAuthToken(token?: string) {
  if (!token || typeof token !== 'string') {
    return false
  }

  const [timestamp, signature] = token.split(':')
  if (!timestamp || !signature) {
    return false
  }

  const tokenTime = Number(timestamp)
  if (!Number.isFinite(tokenTime)) {
    return false
  }

  if (Date.now() - tokenTime > AUTH_DURATION_MS) {
    return false
  }

  const expected = createHmac('sha256', COOKIE_SECRET)
    .update(`${PASSWORD}:${timestamp}`)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function createAuthCookieHeader() {
  const token = createAuthToken()
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${BLOG_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; ${secureFlag}`
}

export function clearAuthCookieHeader() {
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${BLOG_COOKIE_NAME}=deleted; HttpOnly; Path=/; Expires=${new Date(0).toUTCString()}; Max-Age=0; Path=/; SameSite=Lax; ${secureFlag}`
}

export function requestHasValidAuth(req: any) {
  const token = getTokenFromRequest(req, BLOG_COOKIE_NAME)
  return validateAuthToken(token)
}

export function validateAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const config = getAdminConfig()
  const validEmail = timingSafeEqual(Buffer.from(hashSecret(normalizedEmail)), Buffer.from(hashSecret(config.email)))
  const validPassword = timingSafeEqual(Buffer.from(hashSecret(password)), Buffer.from(config.passwordHash))
  return validEmail && validPassword
}

export function createAdminToken() {
  const config = getAdminConfig()
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', config.authSecret)
    .update(`${config.email}:${timestamp}`)
    .digest('hex')
  return `${timestamp}:${signature}`
}

export function validateAdminToken(token?: string) {
  if (!token || typeof token !== 'string') {
    return false
  }

  const [timestamp, signature] = token.split(':')
  if (!timestamp || !signature) {
    return false
  }

  const tokenTime = Number(timestamp)
  if (!Number.isFinite(tokenTime)) {
    return false
  }

  if (Date.now() - tokenTime > AUTH_DURATION_MS) {
    return false
  }

  const config = getAdminConfig()
  const expected = createHmac('sha256', config.authSecret)
    .update(`${config.email}:${timestamp}`)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function createAdminCookieHeader() {
  const token = createAdminToken()
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; ${secureFlag}`
}

export function clearAdminCookieHeader() {
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${ADMIN_COOKIE_NAME}=deleted; HttpOnly; Path=/; Expires=${new Date(0).toUTCString()}; Max-Age=0; Path=/; SameSite=Lax; ${secureFlag}`
}

export function requestHasValidAdminAuth(req: any) {
  const token = getTokenFromRequest(req, ADMIN_COOKIE_NAME)
  return validateAdminToken(token)
}

export function createAdminOtpToken(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', ADMIN_OTP_SECRET)
    .update(`${normalizedEmail}:${code}:${timestamp}`)
    .digest('hex')
  return `${timestamp}:${signature}`
}

export function validateAdminOtpToken(email: string, code: string, token?: string) {
  if (!token || typeof token !== 'string') {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  const [timestamp, signature] = token.split(':')
  if (!timestamp || !signature) {
    return false
  }

  const tokenTime = Number(timestamp)
  if (!Number.isFinite(tokenTime)) {
    return false
  }

  if (Date.now() - tokenTime > OTP_EXPIRATION_MS) {
    return false
  }

  const expected = createHmac('sha256', ADMIN_OTP_SECRET)
    .update(`${normalizedEmail}:${code}:${timestamp}`)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function generateAdminOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
