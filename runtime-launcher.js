'use strict';
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('node:http');
const { spawn } = require('node:child_process');
const apiPort = Number(process.env.BACKEND_PORT), uiPort = Number(process.env.FRONTEND_PORT);
const application = spawn('npm', ['run', 'dev', '--', '--webpack', '--hostname', '127.0.0.1', '--port', String(uiPort)], { cwd: __dirname, env: { ...process.env, PORT: String(uiPort), NEXTAUTH_URL: `http://127.0.0.1:${uiPort}` }, stdio: 'inherit' });
const apiProxy = http.createServer((request, response) => {
  const upstream = http.request({ hostname: '127.0.0.1', port: uiPort, path: request.url, method: request.method, headers: { ...request.headers, host: `127.0.0.1:${uiPort}` } }, (upstreamResponse) => { response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers); upstreamResponse.pipe(response); });
  upstream.on('error', () => { if (!response.headersSent) response.writeHead(502, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: 'Application upstream unavailable' })); });
  request.pipe(upstream);
});
apiProxy.listen(apiPort, '127.0.0.1');
let stopping = false;
function stop(signal = 'SIGTERM') { if (stopping) return; stopping = true; apiProxy.close(); if (!application.killed) application.kill(signal); }
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(signal));
application.on('error', (error) => { console.error('Unable to start application', error.message); process.exitCode = 1; stop(); });
application.on('exit', (code, signal) => apiProxy.close(() => process.exit(code ?? (signal ? 1 : 0))));
