/**
 * Definiciones de tipos para bibliotecas sin tipos integrados
 */

// Tipos para dom-to-image-more
declare module 'dom-to-image-more' {
  interface DomToImageOptions {
    /**
     * Width in pixels to be applied to node before rendering
     */
    width?: number;

    /**
     * Height in pixels to be applied to node before rendering
     */
    height?: number;

    /**
     * A string value for the background color, any valid CSS color value
     */
    bgcolor?: string;

    /**
     * A number between 0 and 1 indicating image quality (e.g. 0.92 => 92%) of the JPEG image
     */
    quality?: number;

    /**
     * A scaling factor to apply to the canvas. Defaults to 1.0
     */
    scale?: number;

    /**
     * Append the current time as a query string to URL requests to enable cache busting
     */
    cacheBust?: boolean;

    /**
     * A data URL for a placeholder image that will be used when fetching an image fails
     */
    imagePlaceholder?: string;

    /**
     * Function to filter elements that should not be rendered
     */
    filter?: (node: HTMLElement) => boolean;

    /**
     * Function to be called when cloning document for rendering, may be used to modify cloned DOM elements
     */
    onclone?: (clonedDoc: Document) => void | Promise<void>;

    /**
     * Configure for cross-origin content
     */
    corsImg?: boolean | { [key: string]: string };

    /**
     * Allows optionally setting the useCredentials option if the resource matches a pattern
     */
    useCredentialFilters?: string[];
  }

  /**
   * Convierte un nodo DOM a una imagen PNG
   */
  export function toPng(node: HTMLElement, options?: DomToImageOptions): Promise<string>;

  /**
   * Convierte un nodo DOM a una imagen JPG
   */
  export function toJpeg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;

  /**
   * Convierte un nodo DOM a un SVG
   */
  export function toSvg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;

  /**
   * Convierte un nodo DOM a un Blob
   */
  export function toBlob(node: HTMLElement, options?: DomToImageOptions): Promise<Blob>;

  /**
   * Convierte un nodo DOM a un canvas
   */
  export function toCanvas(node: HTMLElement, options?: DomToImageOptions): Promise<HTMLCanvasElement>;

  /**
   * Convierte un nodo DOM a un Pixel Data
   */
  export function toPixelData(node: HTMLElement, options?: DomToImageOptions): Promise<Uint8Array>;

  // Exportar la función por defecto
  export default {
    toPng,
    toJpeg,
    toSvg,
    toBlob,
    toCanvas,
    toPixelData
  };
}