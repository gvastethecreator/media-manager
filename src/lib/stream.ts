import { NextRequest } from 'next/server'

export interface StreamData {
  stream: ReadableStream
  writer: WritableStreamDefaultWriter
}

export async function createStream(id: string, request: NextRequest): Promise<StreamData> {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  return {
    stream: readable,
    writer
  }
}