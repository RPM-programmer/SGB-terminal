const http = require('http');
const https = require('https');
const readline = require('readline');
const PROXY_PORT = 8080;
let TARGET_URL = null;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question('Введите целевой URL (например, http://localhost:3000', (answer) => {
    let input = answer.trim();
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
        input = 'http://' + input;
    }
    try {
        TARGET_URL = new URL(input);
        rl.close();
        startProxyServer(); 
    } catch (err) {
        console.error('Ошибка: Введен неверный формат URL. Попробуйте снова.');
        process.exit(1);
    }
});
function startProxyServer() {
    const server = http.createServer((clientReq, clientRes) => {
        const isHttps = TARGET_URL.protocol === 'https:';
        const transport = isHttps ? https : http;
        console.log(`[Proxy] ${clientReq.method} ${clientReq.url} -> [${TARGET_URL.protocol.toUpperCase()}] ${TARGET_URL.host}`);
        const proxyOptions = {
            protocol: TARGET_URL.protocol,
            host: TARGET_URL.hostname,
            port: TARGET_URL.port || (isHttps ? 443 : 80),
            path: clientReq.url,
            method: clientReq.method,
            headers: {
                ...clientReq.headers,
                'host': TARGET_URL.host, // Подменяем Host для корректной работы HTTPS
                'x-forwarded-for': clientReq.socket.remoteAddress,
                'x-forwarded-proto': 'http'
            }
        };
        const proxyReq = transport.request(proxyOptions, (targetRes) => {
            clientRes.writeHead(targetRes.statusCode, targetRes.headers);
            targetRes.pipe(clientRes);
        });
        proxyReq.on('error', (err) => {
            console.error('Proxy Error:', err.message);
            clientRes.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
            clientRes.end(`Ошибка прокси: не удалось связаться с сервером ${TARGET_URL.host}`);
        });
        clientReq.pipe(proxyReq);
    });
    server.listen(PROXY_PORT, () => {
        console.log(`\nПрокси-сервер успешно запущен на http://localhost:${PROXY_PORT}`);
        console.log(`Все входящие запросы пересылаются на: ${TARGET_URL.href}\n`);
    });
}