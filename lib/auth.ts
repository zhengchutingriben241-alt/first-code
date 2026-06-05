import { createHmac, createHash, timingSafeEqual } from 'crypto'

const BLOG_COOKIE_NAME = 'blog-auth'
const ADMIN_COOKIE_NAME = 'admin-auth'
const PASSWORD = process.env.BLOG_READER_PASSWORD || 'blog4me2026!'
const COOKIE_SECRET = process.env.BLOG_AUTH_SECRET || PASSWORD
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'
const ADMIN_COOKIE_SECRET = process.env.ADMIN_AUTH_SECRET || ADMIN_PASSWORD
const MAX_AGE = 60 * 60 * 24
const AUTH_DURATION_MS = MAX_AGE * 1000

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
  const validEmail = timingSafeEqual(Buffer.from(hashSecret(email)), Buffer.from(hashSecret(ADMIN_EMAIL)))
  const validPassword = timingSafeEqual(Buffer.from(hashSecret(password)), Buffer.from(hashSecret(ADMIN_PASSWORD)))
  return validEmail && validPassword
}

export function createAdminToken() {
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', ADMIN_COOKIE_SECRET)
    .update(`${ADMIN_EMAIL}:${timestamp}`)
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

  const expected = createHmac('sha256', ADMIN_COOKIE_SECRET)
    .update(`${ADMIN_EMAIL}:${timestamp}`)
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
