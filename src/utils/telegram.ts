const CONFIG_KEY = 'motogest_telegram'

export interface TelegramConfig {
  botToken: string
  chatId:   string
  enabled:  boolean
}

// Credenciais padrão vindas das variáveis de ambiente (não expostas no código)
const DEFAULT_CONFIG: TelegramConfig = {
  botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN ?? '',
  chatId:   import.meta.env.VITE_TELEGRAM_CHAT_ID   ?? '',
  enabled:  true,
}

// ── Config persistence ────────────────────────────────────────────────────────

export function getTelegramConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    const stored = JSON.parse(raw) as TelegramConfig
    return {
      botToken: stored.botToken || DEFAULT_CONFIG.botToken,
      chatId:   stored.chatId   || DEFAULT_CONFIG.chatId,
      enabled:  stored.enabled  ?? DEFAULT_CONFIG.enabled,
    }
  } catch {
    return DEFAULT_CONFIG
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
        signal: AbortSignal.timeout(8000),
      }
    )
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export async function testTelegram(cfg: TelegramConfig, text: string): Promise<{ ok: boolean; desc: string }> {
  if (!cfg.botToken || !cfg.chatId) return { ok: false, desc: 'Token ou Chat ID vazio.' }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cfg.chatId, text, parse_mode: 'HTML' }),
        signal: AbortSignal.timeout(8000),
      }
    )
    if (res.ok) return { ok: true, desc: 'Mensagem enviada com sucesso!' }
    const json = await res.json().catch(() => ({}))
    return { ok: false, desc: json?.description ?? `Erro HTTP ${res.status}` }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Sem resposta do servidor'
    return { ok: false, desc: msg }
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
    `🏍️ <b>Moto Pro</b>\n` +
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
    `🏍️ <b>Moto Pro</b>\n` +
    `─────────────────\n` +
    `🚪 <b>Logout realizado</b>\n\n` +
    `👤 Usuário: <code>${username}</code>\n` +
    `📋 Perfil: ${role === 'admin' ? 'Administrador' : 'Suporte'}\n` +
    `📅 ${date} às ${time}\n` +
    `⏱️ Sessão: ${sessionDuration(loginAt)}`
  )
}
