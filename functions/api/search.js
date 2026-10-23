export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text();
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    // Read response as raw text first so we don't crash on Cloudflare 524 HTML payloads
    const textData = await response.text();

    return new Response(textData, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}