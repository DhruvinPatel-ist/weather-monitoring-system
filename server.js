import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV === 'development';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`Starting Next.js server in ${process.env.NODE_ENV} mode on port ${port}...`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);

    if (!dev) {
      // ✅ Only in production
      res.setHeader("X-Frame-Options", "DENY"); // prevent clickjacking
    //  response.headers.set(
    //     "Content-Security-Policy",
    //     `
    //       default-src 'self';
    //       script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com;
    //       connect-src 'self' https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com;
    //       img-src 'self' data: https://www.google.com https://www.gstatic.com https://www.google-analytics.com;
    //       frame-src https://www.google.com https://www.gstatic.com;
    //       style-src 'self' 'unsafe-inline' https://www.gstatic.com;
    //       frame-ancestors 'none';
    //     `.replace(/\s+/g, " ")
    //   );
    res.headers.set(
  "Content-Security-Policy",
  `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com https://*.tile.openstreetmap.org;
    img-src 'self' data: https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://*.tile.openstreetmap.org https://unpkg.com;
    frame-src https://www.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://www.gstatic.com;
    frame-ancestors 'none';
  `.replace(/\s+/g, " ")
);
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
      res.setHeader("X-Powered-By", ""); // hide server info
    } else {
      console.log("Skipping strict security headers in development for Fast Refresh");
    }

    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});