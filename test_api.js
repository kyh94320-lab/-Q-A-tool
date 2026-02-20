const https = require('https');

const API_KEY = 'AIzaSyCNzZ7zsmJf16WkcU8oGeUdbl1jsaoT6ac';
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
