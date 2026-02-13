const http = require('http');
const https = require('https');
const url = require('url');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  // Parse the target URL from the query parameter
  const parsedUrl = url.parse(req.url, true);
  const targetUrl = parsedUrl.query.url;

  if (!targetUrl) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clean Web Proxy</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            input { padding: 10px; width: 300px; }
            button { padding: 10px 20px; }
          </style>
        </head>
        <body>
          <h1>🔗 Clean Web Proxy</h1>
          <p>Browse the web without extensions interfering</p>
          <form>
            <input type="text" name="url" placeholder="Enter URL (e.g., https://google.com)" required>
            <button type="submit">Visit</button>
          </form>
        </body>
      </html>
    `);
    return;
  }

  // Remove extension-related headers and scripts
  const protocol = targetUrl.startsWith('https') ? https : http;
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
    // Filter out headers that might trigger extensions
    const headersToRemove = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options'
    ];
    
    const filteredHeaders = {};
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (!headersToRemove.includes(key.toLowerCase())) {
        filteredHeaders[key] = value;
      }
    }

    res.writeHead(proxyRes.statusCode, filteredHeaders);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error</h1><p>${err.message}</p>`);
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(port, hostname, () => {
  console.log(`🚀 Clean Web Proxy running at http://${hostname}:${port}/`);
  console.log(`Visit: http://${hostname}:${port}/?url=https://google.com`);
});
