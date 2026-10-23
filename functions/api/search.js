export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text();
    
    // The function securely attaches the API key stored in Cloudflare's Variables and Secrets
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
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