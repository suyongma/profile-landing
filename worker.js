export default {
  async fetch(request, env) {
    try {
      if (env && env.ASSETS) {
        const url = new URL(request.url);

        // If accessed via world.mashong.com subdomain root, route directly to world.html
        if (url.hostname === 'world.mashong.com' && (url.pathname === '/' || url.pathname === '')) {
          const worldUrl = new URL('/world.html', request.url);
          return await env.ASSETS.fetch(new Request(worldUrl, request));
        }

        // If accessed via tests.mashong.com subdomain root, route directly to tests.html
        if ((url.hostname === 'tests.mashong.com' || url.hostname === 'test.mashong.com') && (url.pathname === '/' || url.pathname === '')) {
          const testsUrl = new URL('/tests.html', request.url);
          return await env.ASSETS.fetch(new Request(testsUrl, request));
        }

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