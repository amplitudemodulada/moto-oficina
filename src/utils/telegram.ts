const CONFIG_KEY = 'motogest_telegram'

export interface TelegramConfig {
  botToken: string
  chatId:   string
  enabled:  boolean
}

// ── Config persistence ────────────────────────────────────────────────────────

export function getTelegramConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : { botToken: '', chatId: '', enabled: false }
  } catch {
    return { botToken: '', chatId: '', enabled: false }
  }
}

export function saveTelegramConfig(cfg: TelegramConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export async function sendTelegram(text: string): Promise<'ok' | 'error'> {
  const cfg = getTelegramConfig()
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId) return 'ok'
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cfg.chatId, text, parse_mode: 'HTML' }),
      }
    )
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

function now(): { date: string; time: string } {
  const d = new Date()
  return {
    date: d.toLocaleDateString('pt-BR',  { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('pt-BR',  { hour: '2-digit', minute: '2-digit' }),
  }
}

function sessionDuration(loginAt: string): string {
  const diff = Math.floor((Date.now() - new Date(loginAt).getTime()) / 60000)
  const h    = Math.floor(diff / 60)
  const m    = diff % 60
  return h > 0 ? `${h}h ${m}min` : `${diff}min`
}

const ROLE_EMOJI: Record<string, string> = { admin: '🔐', suporte: '🎧' }

export function msgLogin(username: string, role: string): string {
  const { date, time } = now()
  return (
    `🏍️ <b>MotoGest</b>\n` +
    `─────────────────\n` +
    `${ROLE_EMOJI[role] ?? '👤'} <b>Login realizado</b>\n\n` +
    `👤 Usuário: <code>${username}</code>\n` +
    `📋 Perfil: ${role === 'admin' ? 'Administrador' : 'Suporte'}\n` +
    `📅 ${date} às ${time}`
  )
}

export function msgLogout(username: string, role: string, loginAt: string): string {
  const { date, time } = now()
  return (
    `🏍️ <b>MotoGest</b>\n` +
    `─────────────────\n` +
    `🚪 <b>Logout realizado</b>\n\n` +
    `👤 Usuário: <code>${username}</code>\n` +
    `📋 Perfil: ${role === 'admin' ? 'Administrador' : 'Suporte'}\n` +
    `📅 ${date} às ${time}\n` +
    `⏱️ Sessão: ${sessionDuration(loginAt)}`
  )
}
