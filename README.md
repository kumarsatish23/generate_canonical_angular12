# Technical Documentation: Generating Canonical URLs in Angular Universal

**NOTE**: This documentation is to be followed for Angular versions that don't support auto **SSR (Server Side Rendering)**.

![Angular Badge](https://img.shields.io/badge/Angular-0F0F11?logo=angular&logoColor=fff&style=for-the-badge)
![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff&style=for-the-badge)
![HTML5 Badge](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff&style=for-the-badge)

## Angular Version | Built-in SSR Schematic | Recommended Approach
| Angular Version | Built-in SSR Schematic | Recommended Approach |
| --------------- | ----------------------- | --------------------- |
| 12              | No                      | @nguniversal/express-engine or manual setup |
| 13 and 14      | Yes (limited)           | Built-in schematic or @nguniversal/express-engine |
| 15 (unreleased)| Potentially dedicated schematics | TBD based on final release features |

## 1. Introduction
This document provides a technical overview of how to generate canonical URLs dynamically in an Angular Universal application using Express.js server-side rendering.

## 2. Background
Canonical URLs are important for search engine optimization (SEO) as they specify the preferred URL for a webpage when there are multiple URLs that point to the same content. In Angular Universal applications, generating canonical URLs dynamically is essential for ensuring proper indexing and ranking by search engines.

## 3. Implementation
The implementation involves modifying the server-side rendering logic to inject the canonical URL into the HTML content before sending it to the client.

### 3.1. Dependencies
Ensure the following dependencies are installed:
- `@nguniversal/express-engine`: Provides server-side rendering support for Angular Universal.
- `express`: Web server framework for Node.js.
- `fs`: File system module for Node.js.

```bash
$ npm install @nguniversal/express-engine express fs
```

### 3.2. Server-Side Rendering Logic
In the `server.ts` file, the following steps are taken:
- Import necessary modules and dependencies.
- Configure the Express server.
- Define the middleware to generate the canonical URL.
- Handle requests to render Angular Universal application.
- Start the server.

```typescript
// Import necessary modules and dependencies
import 'zone.js/dist/zone-node';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';
import { AppServerModule } from './src/main.server';
import * as fs from 'fs';
import { existsSync } from 'fs';

// Configure the Express server
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/jius-frontend/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine
  server.engine('html', ngExpressEngine({ bootstrap: AppServerModule }));
  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, { maxAge: '1y' }));

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    const renderedHtml = renderIndexHtml(req);
    res.send(renderedHtml);
  });

  return server;
}
```

### 3.3. Generating Canonical URL Middleware
Middleware is added to the Express server to generate the canonical URL dynamically for each incoming request.
- The middleware calculates the canonical URL based on the request protocol, host, and original URL.
- It stores the canonical URL in the `res.locals` object, making it accessible in subsequent middleware functions and route handlers.

```typescript
// Middleware to generate canonical URL dynamically
server.use((req, res, next) => {
  res.locals.canonicalUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  next();
});
```

### 3.4. Injecting Canonical URL into HTML
When rendering the Angular Universal application, the canonical URL is injected into the HTML content before sending it to the client.
- The HTML content of the `index.html` file is read and stored as a string.
- The placeholder `<link rel="canonical">` tag in the HTML content is replaced with the dynamically generated canonical URL.
- The modified HTML content is sent as the server response to the client.
```typescript
// Injecting Canonical URL into HTML
function renderIndexHtml(req: express.Request): string {
  const canonicalUrl = res.locals.canonicalUrl;
  const indexHtmlPath = join(process.cwd(), 'dist/jius-frontend/browser', 'index.html');
  let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  indexHtmlContent = indexHtmlContent.replace('<link rel="canonical">', `<link rel="canonical" href="${canonicalUrl}">`);
  return indexHtmlContent;
}
```

## 4. Build & Server
To build and serve the code with Enabled SSR(Server side rendering), run the application as per below commands:
```bash
$ npm run dev:ssr
```
```bash
$ npm run serve:ssr
```
```bash
$ npm run build:ssr-stg
```
```bash
$ npm run build:ssr-local
```
```bash
$ npm build:ssr
```
Ensure `package.json` has these lines:
```json
{
  "name": "jius-frontend",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "dev:ssr": "ng run jius-frontend:serve-ssr",
    "serve:ssr": "node dist/jius-frontend/server/main.js",
    "build:ssr-stg": "ng build --configuration=staging && sitemap-generator https://staging.********.com -f src/sitemap.xml && ng run jius-frontend:server --configuration=development",
    "build:ssr-local": "ng build --configuration=development && ng run jius-frontend:server  --configuration=development",
    "build:ssr": "ng build --configuration=production && sitemap-generator https://********.com -f src/sitemap.xml && ng run jius-frontend:server",
    "prerender": "ng run jius-frontend:prerender"
  }
}
```

## 5. Conclusion
Generating canonical URLs dynamically in Angular Universal applications using Express.js server-side rendering is crucial for improving SEO and ensuring proper indexing by search engines. By following the steps outlined in this document, developers can implement this feature effectively to enhance the discoverability and ranking of their web applications.
