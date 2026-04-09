async function check() {
  try {
    const res = await fetch('https://nexusedu-backend-0bjq.onrender.com/api/catalog');
    const data = await res.json();
    const videoId = data.subjects[0].cycles[0].chapters[0].videos[0].id;
    console.log('Video ID:', videoId);
    
    const streamRes = await fetch(`https://nexusedu-backend-0bjq.onrender.com/api/stream/${videoId}`, { method: 'HEAD' });
    console.log('Stream HEAD:', streamRes.status, streamRes.headers.get('content-type'));
    
    const streamGet = await fetch(`https://nexusedu-backend-0bjq.onrender.com/api/stream/${videoId}`, { headers: { Range: 'bytes=0-100' } });
    console.log('Stream GET:', streamGet.status, streamGet.headers.get('content-type'));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
