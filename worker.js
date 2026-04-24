export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS HEADERS
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-ingest-token"
    };

    // HANDLE PREFLIGHT
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // SQL DEBUG
    if (url.pathname === "/debug/sql") {
      const token = request.headers.get("x-ingest-token");
      if (token !== env.INGEST_TOKEN) {
        return new Response(JSON.stringify({ ok:false,error:"Unauthorized"}), {
          status:401,
          headers: { ...cors, "Content-Type":"application/json" }
        });
      }

      try {
        const body = await request.json();
        const result = await env.DB.prepare(body.sql).all();
        return new Response(JSON.stringify({ ok:true, rows: result.results }), {
          headers: { ...cors, "Content-Type":"application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok:false,error:String(e) }), {
          headers: { ...cors, "Content-Type":"application/json" }
        });
      }
    }

    // TASK RUN
    if (url.pathname === "/tasks/run") {
      const token = request.headers.get("x-ingest-token");
      if (token !== env.INGEST_TOKEN) {
        return new Response(JSON.stringify({ ok:false,error:"Unauthorized"}), {
          status:401,
          headers: { ...cors, "Content-Type":"application/json" }
        });
      }

      return new Response(JSON.stringify({ ok:true, note:"task endpoint live" }), {
        headers: { ...cors, "Content-Type":"application/json" }
      });
    }

    // HEALTH
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok:true }), {
        headers: { ...cors, "Content-Type":"application/json" }
      });
    }

    return new Response("OK", { headers: cors });
  }
};
