/**
 * Legacy reindex endpoints.
 *
 * Reindex is a filesystem mutation and must be initiated through an authorized
 * folder route. The former global endpoints accepted arbitrary database folder
 * IDs, so they remain registered only to return an explicit retirement response.
 */

import express from 'express';

const router = express.Router();

router.use((_request, response) => {
	response.status(410).json({
		code: 'AUTHORIZED_FOLDER_OPERATION_REQUIRED',
		message: 'El reindex global fue retirado; usa la operación autorizada del folder.',
		retryable: false,
	});
});

export { router as reindexIncrementalRouter };
export default router;
