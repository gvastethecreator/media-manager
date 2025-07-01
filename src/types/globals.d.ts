/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Tipos globales para el navegador
declare global {
  interface Window {
    [key: string]: any;
  }

  // Asegurar que los tipos de DOM están disponibles
  interface Document extends globalThis.Document {}
  interface HTMLElement extends globalThis.HTMLElement {}
  interface HTMLDivElement extends globalThis.HTMLDivElement {}
  interface HTMLButtonElement extends globalThis.HTMLButtonElement {}
  interface HTMLInputElement extends globalThis.HTMLInputElement {}
  interface HTMLImageElement extends globalThis.HTMLImageElement {}
  interface HTMLCanvasElement extends globalThis.HTMLCanvasElement {}
  interface HTMLSelectElement extends globalThis.HTMLSelectElement {}
  interface HTMLTextAreaElement extends globalThis.HTMLTextAreaElement {}
  interface HTMLParagraphElement extends globalThis.HTMLParagraphElement {}
  interface HTMLHeadingElement extends globalThis.HTMLHeadingElement {}
  interface HTMLSpanElement extends globalThis.HTMLSpanElement {}
  interface HTMLAudioElement extends globalThis.HTMLAudioElement {}

  // Eventos
  interface MouseEvent extends globalThis.MouseEvent {}
  interface KeyboardEvent extends globalThis.KeyboardEvent {}
  interface ChangeEvent<T = Element> extends globalThis.Event {
    target: T & { value: string };
  }

  // APIs del navegador
  interface URL extends globalThis.URL {}
  interface URLSearchParams extends globalThis.URLSearchParams {}
  interface FormData extends globalThis.FormData {}
  interface FileList extends globalThis.FileList {}
  interface File extends globalThis.File {}
  interface Blob extends globalThis.Blob {}
  interface FileReader extends globalThis.FileReader {}
  interface Image extends globalThis.HTMLImageElement {}

  // APIs de tiempo
  interface NodeJS {
    Timeout: any;
  }

  // Funciones globales
  const setTimeout: typeof globalThis.setTimeout;
  const clearTimeout: typeof globalThis.clearTimeout;
  const setInterval: typeof globalThis.setInterval;
  const clearInterval: typeof globalThis.clearInterval;
  const requestAnimationFrame: typeof globalThis.requestAnimationFrame;
  const cancelAnimationFrame: typeof globalThis.cancelAnimationFrame;

  // APIs de navegador
  const fetch: typeof globalThis.fetch;
  const localStorage: typeof globalThis.localStorage;
  const navigator: typeof globalThis.navigator;
  const document: typeof globalThis.document;
  const window: typeof globalThis.window;
  const alert: typeof globalThis.alert;
  const confirm: typeof globalThis.confirm;
  const crypto: typeof globalThis.crypto;

  // Observadores
  interface ResizeObserver extends globalThis.ResizeObserver {}
  interface IntersectionObserver extends globalThis.IntersectionObserver {}
  interface MutationObserver extends globalThis.MutationObserver {}

  // Streams y contextos de renderizado
  interface ReadableStream extends globalThis.ReadableStream {}
  interface WritableStreamDefaultWriter extends globalThis.WritableStreamDefaultWriter {}
  interface TransformStream extends globalThis.TransformStream {}
  interface CanvasRenderingContext2D extends globalThis.CanvasRenderingContext2D {}

  // Headers y Request/Response
  interface Headers extends globalThis.Headers {}
  interface Request extends globalThis.Request {}
  interface Response extends globalThis.Response {}
  interface RequestInit extends globalThis.RequestInit {}
  interface HeadersInit extends globalThis.HeadersInit {}

  // Otros
  interface ClipboardItem extends globalThis.ClipboardItem {}
  interface CustomEvent extends globalThis.CustomEvent {}
  interface EventListener extends globalThis.EventListener {}
  interface MediaQueryListEvent extends globalThis.MediaQueryListEvent {}
  interface TextEncoder extends globalThis.TextEncoder {}
  interface Element extends globalThis.Element {}
  interface Node extends globalThis.Node {}

  // Performance
  const performance: typeof globalThis.performance;
}

export { };
