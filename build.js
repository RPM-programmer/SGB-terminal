const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}
const proxyIP = getLocalIP();
console.log(`[INFO] Локальный IP прокси-сервера определен автоматически: ${proxyIP}\n`);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question('Введите имя вашей Wi-Fi сети (SSID): ', (wifiName) => {
    rl.question('Введите пароль от Wi-Fi: ', (wifiPassword) => {
        const filePath = path.join(__dirname, 'main.cpp.txt');
        if (!fs.existsSync(filePath)) {
            console.error(`[ERROR] Не найден файл по пути: ${filePath}`);
            rl.close();
            return;
        }
        let fileContent = fs.readFileSync(filePath, 'utf8');
        const updatedContent = fileContent
            .replace(/\/\*WIFI-NAME\*\//g, wifiName)
            .replace(/\/\*WIFI-PASSWORD\*\//g, wifiPassword)
            .replace(/\/\*PROXY-IP\*\//g, proxyIP);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log('\n[SUCCESS] Файл main.cpp успешно обновлен!');
        console.log(`- Wi-Fi: ${wifiName}`);
        console.log(`- Прокси IP: ${proxyIP}`);
        rl.close();
    });
});
