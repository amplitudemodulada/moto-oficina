export type UserRole = 'admin' | 'suporte'

export interface StoredUser {
  username: string
  role: UserRole
  passwordHash: string
  displayName: string
}

export interface Session {
  username: string
  role: UserRole
  displayName: string
  token: string
  loginAt: string
}

const USERS_KEY   = 'motogest_users'
const SESSION_KEY = 'motogest_session'
const SALT        = 'motogest@2025#oficina'

// ── Crypto helpers ────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SALT)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── User store ────────────────────────────────────────────────────────────────

export function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export async function initDefaultUsers(): Promise<void> {
  if (getUsers().length > 0) return
  const [adminHash, suporteHash] = await Promise.all([
    hashPassword('admin@2026!'),
    hashPassword('suporte@2026!'),
  ])
  saveUsers([
    { username: 'admin',   role: 'admin',   displayName: 'Administrador', passwordHash: adminHash   },
    { username: 'suporte', role: 'suporte', displayName: 'Suporte',       passwordHash: suporteHash },
  ])
}

export type ChangePasswordResult = 'ok' | 'wrong_current' | 'not_found'

export async function changePasswordSelf(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const users = getUsers()
  const idx = users.findIndex(u => u.username === username)
  if (idx === -1) return 'not_found'
  const currentHash = await hashPassword(currentPassword)
  if (currentHash !== users[idx].passwordHash) return 'wrong_current'
  users[idx].passwordHash = await hashPassword(newPassword)
  saveUsers(users)
  return 'ok'
}

export async function resetPasswordAdmin(username: string, newPassword: string): Promise<void> {
  const users = getUsers()
  const idx = users.findIndex(u => u.username === username)
  if (idx === -1) return
  users[idx].passwordHash = await hashPassword(newPassword)
  saveUsers(users)
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<Session | null> {
  const user = getUsers().find(u => u.username === username.toLowerCase().trim())
  if (!user) return null
  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) return null
  const session: Session = {
    username:    user.username,
    role:        user.role,
    displayName: user.displayName,
    token:       generateToken(),
    loginAt:     new Date().toISOString(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
