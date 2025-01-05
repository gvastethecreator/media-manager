import { MockHeaders } from './headers-mocks'

// Implementación base de Response
class BaseResponse {
  private readonly _body: any
  private readonly _status: number
  private readonly _statusText: string
  private readonly _headers: MockHeaders
  private _bodyUsed: boolean = false

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this._body = body
    this._status = init?.status || 200
    this._statusText = init?.statusText || ''
    this._headers = new MockHeaders(init?.headers)
  }

  get status(): number {
    return this._status
  }

  get statusText(): string {
    return this._statusText
  }

  get ok(): boolean {
    return this._status >= 200 && this._status < 300
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
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
  }

  async text(): Promise<string> {
    if (this._bodyUsed) {
      throw new Error('Body has already been consumed.')
    }
    this._bodyUsed = true
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
  }

  clone(): BaseResponse {
    return new BaseResponse(this._body, {
      status: this._status,
      statusText: this._statusText,
      headers: this._headers.toJSON()
    })
  }
}

// Implementación de NextRequest
class MockNextRequest {
  private readonly _url: string
  private readonly _method: string
  private readonly _headers: MockHeaders
  private readonly _body: any
  private _bodyUsed: boolean = false

  constructor(input: string | URL | MockNextRequest, init?: RequestInit) {
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

  clone(): MockNextRequest {
    return new MockNextRequest(this._url, {
      method: this._method,
      headers: this._headers.toJSON(),
      body: this._body
    })
  }
}

// Implementación de NextResponse
class MockNextResponse extends BaseResponse {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init)
    Object.setPrototypeOf(this, MockNextResponse.prototype)
  }

  static json(data: any, init?: ResponseInit): MockNextResponse {
    const headers = new MockHeaders(init?.headers || {})
    headers.set('content-type', 'application/json')

    return new MockNextResponse(JSON.stringify(data), {
      ...init,
      headers,
      status: init?.status || 200
    })
  }
}

// Extender el objeto global
declare global {
  var Response: typeof BaseResponse
  var NextResponse: typeof MockNextResponse & {
    json(data: any, init?: ResponseInit): MockNextResponse
  }
  var NextRequest: typeof MockNextRequest
}

// Mock de next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => MockNextResponse.json(data, init)
  },
  NextRequest: MockNextRequest
}))

// Asignar los mocks al objeto global
if (!global.Response) {
  Object.defineProperty(global, 'Response', {
    value: BaseResponse,
    writable: true,
    configurable: true,
  })
}

// Asignar NextResponse al objeto global
const NextResponseGlobal = MockNextResponse
NextResponseGlobal.json = MockNextResponse.json.bind(MockNextResponse)

Object.defineProperty(global, 'NextResponse', {
  value: NextResponseGlobal,
  writable: true,
  configurable: true,
})

// Asignar NextRequest al objeto global
Object.defineProperty(global, 'NextRequest', {
  value: MockNextRequest,
  writable: true,
  configurable: true,
})

// Re-exportar para uso en pruebas
export {
  MockNextResponse as NextResponse,
  BaseResponse as Response,
  MockNextRequest as NextRequest
}