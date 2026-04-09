async function check() {
  try {
    const res = await fetch('https://nexusedu-backend-0bjq.onrender.com/api/health');
    const text = await res.text();
    console.log('Render health:', res.status, text);
  } catch (e) {
    console.error('Render error:', e.message);
  }

  try {
    const res = await fetch('https://edbe7e18-233b-4ff5-bed9-83c4e0edd51e-00-25a1ryv2rxe0o.sisko.replit.dev/api/health');
    const text = await res.text();
    console.log('Replit health:', res.status, text);
  } catch (e) {
    console.error('Replit error:', e.message);
  }
}

check();
