import type { APIRoute } from 'astro';

// Use SheetDB URL from environment variable
const SHEETDB_URL = import.meta.env.SHEETDB_URL;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    // Forward the form data to SheetDB
    const response = await fetch(SHEETDB_URL, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    // You can customize the response as needed
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
