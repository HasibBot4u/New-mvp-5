fetch('https://nexusedu-backend-0bjq.onrender.com/api/health', {
  headers: { 'Origin': 'http://localhost:3000' }
}).then(r => {
  console.log('Origin:', r.headers.get('access-control-allow-origin'));
  console.log('Creds:', r.headers.get('access-control-allow-credentials'));
});
