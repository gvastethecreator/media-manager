'use server';

import initializeServer from '@/lib/server/init-server';

export async function initServer() {
    await initializeServer();
    return { success: true };
}
