import type { Cliente, Moto, OrdemServico, Produto } from '../types'

const KEYS = {
  clientes: 'motogest_clientes',
  motos: 'motogest_motos',
  ordens: 'motogest_ordens',
  produtos: 'motogest_produtos',
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const storage = {
  clientes: {
    getAll: () => load<Cliente>(KEYS.clientes),
    save: (data: Cliente[]) => save(KEYS.clientes, data),
  },
  motos: {
    getAll: () => load<Moto>(KEYS.motos),
    save: (data: Moto[]) => save(KEYS.motos, data),
  },
  ordens: {
    getAll: () => load<OrdemServico>(KEYS.ordens),
    save: (data: OrdemServico[]) => save(KEYS.ordens, data),
  },
  produtos: {
    getAll: () => load<Produto>(KEYS.produtos),
    save: (data: Produto[]) => save(KEYS.produtos, data),
  },
}

export function gerarId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function gerarNumeroOS(ordens: OrdemServico[]): string {
  const num = ordens.length + 1
  return String(num).padStart(5, '0')
}
