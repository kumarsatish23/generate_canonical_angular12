import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';

import { AppServerModule } from './src/main.server';
import * as fs from 'fs';
import { existsSync } from 'fs';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/jius-frontend/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));
  //This code generate dynamic url for each page
  server.use((req, res, next) => {
    res.locals.canonicalUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    next();
  });
  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    const renderedHtml = renderIndexHtml(res.locals.canonicalUrl);
    res.send(renderedHtml);
  });

  return server;
}

  //This fuction replaces the values of canonical url in index.html of application making the url dynamic
function renderIndexHtml(canonicalUrl: string): string {
  const indexHtmlPath = join(process.cwd(), 'dist/jius-frontend/browser', 'index.html');
  let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  indexHtmlContent = indexHtmlContent.replace('<link rel="canonical">', `<link rel="canonical" href="${canonicalUrl}">`);
  return indexHtmlContent;
}

function run(): void {
  const port = process.env['PORT'] || 4100;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
