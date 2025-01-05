// Implementación completa de Headers
export class MockHeaders implements Headers {
  private headers: Map<string, string>

  constructor(init?: HeadersInit) {
    this.headers = new Map()

    if (init) {
      if (init instanceof MockHeaders) {
        init.forEach((value, key) => this.append(key, value))
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.append(key, value))
      } else {
        Object.entries(init).forEach(([key, value]) => this.append(key, value))
      }
    }
  }

  append(name: string, value: string): void {
    const key = name.toLowerCase()
    const current = this.headers.get(key)
    this.headers.set(key, current ? `${current}, ${value}` : value)
  }

  delete(name: string): void {
    this.headers.delete(name.toLowerCase())
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase())
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value)
  }

  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
    this.headers.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this)
    })
  }

  *entries(): IterableIterator<[string, string]> {
    yield* this.headers.entries()
  }

  *keys(): IterableIterator<string> {
    yield* this.headers.keys()
  }

  *values(): IterableIterator<string> {
    yield* this.headers.values()
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }

  // Método adicional para convertir a objeto plano
  toJSON(): Record<string, string> {
    return Object.fromEntries(this.headers)
  }
}

// Extender el objeto global
declare global {
  var Headers: typeof MockHeaders
}

// Asignar el mock al objeto global
if (!global.Headers) {
  Object.defineProperty(global, 'Headers', {
    value: MockHeaders,
    writable: true,
    configurable: true,
  })
}

// Re-exportar para uso en pruebas
export { MockHeaders as Headers }