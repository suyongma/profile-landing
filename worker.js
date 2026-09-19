export default {
  async fetch(request, env) {
    try {
      if (env && env.ASSETS) {
        const url = new URL(request.url);
        let response = await env.ASSETS.fetch(request);
        
        // If not found and path doesn't have an extension, try path.html
        if (response.status === 404 && !url.pathname.includes('.')) {
          const htmlPath = url.pathname.replace(/\/$/, '') + '.html';
          const htmlUrl = new URL(htmlPath, request.url);
          const htmlResp = await env.ASSETS.fetch(new Request(htmlUrl, request));
          if (htmlResp.status === 200) {
            return htmlResp;
          }
        }
        return response;
      }
      return new Response("Asset binding not ready", { status: 503 });
    } catch (err) {
      return new Response("Worker error: " + (err.stack || err.message), { 
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
  }
};
