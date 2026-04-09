const https = require('https');

https.get('https://nexusedu-backend-0bjq.onrender.com/', (res) => {
  console.log('Render status:', res.statusCode);
}).on('error', (e) => {
  console.error('Render error:', e.message);
});

https.get('https://edbe7e18-233b-4ff5-bed9-83c4e0edd51e-00-25a1ryv2rxe0o.sisko.replit.dev/', (res) => {
  console.log('Replit status:', res.statusCode);
}).on('error', (e) => {
  console.error('Replit error:', e.message);
});
