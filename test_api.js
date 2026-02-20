const https = require('https');

const API_KEY = ''; // 여기에 Gemini API 키를 입력하거나 환경변수를 사용하세요.
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        if (res.statusCode === 200) {
            const models = JSON.parse(data).models;
            console.log('Available Models:');
            models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log('Error Body:', data);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
