export function writeEvent(type: string, data: any): string {
  return `data: ${JSON.stringify({ type, data })}\n\n`
}

export async function writeStreamEvent(writer: WritableStreamDefaultWriter<any>, type: string, data: any) {
  try {
    const encoder = new TextEncoder()
    const event = writeEvent(type, data)
    await writer.write(encoder.encode(event))
  } catch (error) {
    console.error('Error escribiendo en el stream:', error)
  }
}