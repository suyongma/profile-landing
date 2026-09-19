export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Attempt to fetch requested asset
    let response = await env.ASSETS.fetch(request);
    
    // If not found and path doesn't have an extension, try path.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      const htmlUrl = new URL(url.pathname.replace(/\/$/, '') + '.html', request.url);
      const htmlResp = await env.ASSETS.fetch(new Request(htmlUrl, request));
      if (htmlResp.status === 200) {
        return htmlResp;
      }
    }
    
    return response;
  }
};
