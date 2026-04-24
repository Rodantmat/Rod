export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/debug/sql") {
      const token = request.headers.get("x-ingest-token");
      if (token !== env.INGEST_TOKEN) {
        return new Response(JSON.stringify({ ok:false,error:"Unauthorized"}),{status:401});
      }
      const body = await request.json();
      const result = await env.DB.prepare(body.sql).all();
      return new Response(JSON.stringify({ ok:true, rows: result.results }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("OK");
  }
};
