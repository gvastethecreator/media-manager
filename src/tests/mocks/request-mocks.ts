import { MockHeaders } from './headers-mocks'

// Implementación base de Request
export class MockRequest {
  private readonly _url: string
  private readonly _method: string
  private readonly _headers: MockHeaders
  private readonly _body: any
  private _bodyUsed: boolean = false

  constructor(input: string | URL | MockRequest, init?: RequestInit) {
    if (typeof input === 'string') {
      this._url = input
    } else if (input instanceof URL) {
      this._url = input.toString()
    } else {
      this._url = input.url
    }
    this._method = init?.method || 'GET'
    this._headers = new MockHeaders(init?.headers)
    this._body = init?.body
  }

  get url(): string {
    return this._url
  }

  get method(): string {
    return this._method
  }

  get headers(): MockHeaders {
    return this._headers
  }

  get bodyUsed(): boolean {
    return this._bodyUsed
  }

  async json(): Promise<any> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed.')
    }
    this._bodyUsed = true
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    return this._body
  }

  async text(): Promise<string> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed.')
    }
    this._bodyUsed = true
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
  }

  clone(): MockRequest {
    return new MockRequest(this._url, {
      method: this._method,
      headers: this._headers.toJSON(),
      body: this._body
    })
  }
}

// Mock de NextRequest
export class MockNextRequest extends MockRequest {
  constructor(input: string | URL | MockRequest, init?: RequestInit) {
    super(input, init)
    Object.setPrototypeOf(this, MockNextRequest.prototype)
  }

  // Métodos específicos de NextRequest
  get nextUrl(): URL {
    return new URL(this.url)
  }

  get cookies(): Map<string, string> {
    return new Map()
  }

  get geo(): { country?: string; region?: string; city?: string } {
    return {}
  }

  get ip(): string | undefined {
    return undefined
  }
}

// Extender el objeto global
declare global {
  var Request: typeof MockRequest
  var NextRequest: typeof MockNextRequest
}

// Asignar los mocks al objeto global
if (!global.Request) {
  Object.defineProperty(global, 'Request', {
    value: MockRequest,
    writable: true,
    configurable: true,
  })
}

Object.defineProperty(global, 'NextRequest', {
  value: MockNextRequest,
  writable: true,
  configurable: true,
})

// Re-exportar para uso en pruebas
export { MockRequest as Request, MockNextRequest as NextRequest }