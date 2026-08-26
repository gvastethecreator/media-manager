const port = Number.parseInt(process.env.MEDIA_MANAGER_APP_PORT || '4000', 10);

const server = Bun.serve({
	fetch(request) {
		const url = new URL(request.url);
		if (url.pathname === '/health') return Response.json({ status: 'ready' });
		return new Response('ok');
	},
	hostname: '127.0.0.1',
	port,
});

console.log(`SUPERVISOR_CHILD_READY ${server.port}`);
