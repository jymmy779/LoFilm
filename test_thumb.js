const https = require('https');
https.get('https://phimapi.com/v1/api/quoc-gia/han-quoc?limit=10', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log(json.data.items.map(i => i.thumb_url).join('\n'));
    });
});
