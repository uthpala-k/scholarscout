export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text();
    
    // Using the stable, fast gemini-1.5-flash to prevent 524 timeouts and high-demand errors
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

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