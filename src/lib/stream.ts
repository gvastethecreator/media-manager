export async function writeStreamEvent(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  event: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const encoder = new TextEncoder();
    const formattedData = JSON.stringify({ type: event, data });
    await writer.write(encoder.encode(`data: ${formattedData}\n\n`));
  } catch (error) {
    console.log('Error escribiendo evento:', error instanceof Error ? error.message : 'Error desconocido');
  }
}