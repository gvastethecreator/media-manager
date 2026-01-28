import { Effect } from 'effect';
import { FolderService, FolderServiceLive } from './src/services/folder/folder.service.effect';

const program = Effect.gen(function* () {
	const service = yield* FolderService;
	console.log('Calling getAll...');
	const result = yield* service.getAll({ limit: 50, offset: 0 });
	console.log('Result folders count:', result.folders.length);
}).pipe(Effect.provide(FolderServiceLive));

console.log('Starting reproduction script...');
Effect.runPromise(program)
	.then(() => console.log('Success!'))
	.catch((err) => {
		console.error('Caught error in reproduction script:');
		console.error(err);
	});
