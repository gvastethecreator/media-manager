import type { Request } from 'express';

export interface StreamData {
	stream: ReadableStream;
	writer: WritableStreamDefaultWriter;
}

export async function createStream(_id: string, _request: Request): Promise<StreamData> {
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();

	return {
		stream: readable,
		writer,
	};
}
