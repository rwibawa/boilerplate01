import * as fs from 'fs';
import * as bunyan from 'bunyan';

import * as http from 'http';

import * as path from 'path';
import * as Koa from 'koa';
import { koaBody } from 'koa-body';
import * as render from "koa-ejs";
import * as logger from 'koa-bunyan-logger';

import home from "./components/home";

import { promisify } from 'util';
const stat = promisify(fs.stat);

let _log = bunyan.createLogger( {
  name: 'truview.export',
  streams: [
    {
      stream: process.stdout,
      level: "info"
    },
    {
      stream: process.stderr,
      level: "debug"
    },
    {
      type: 'rotating-file',
      path: './log/foo.log',
      period: '1d',   // daily rotation
      count: 3        // keep 3 back copies
    }
  ]
});

var log = _log.child({ func: 'oauth2-server.main' });

const viewsPath = path.resolve( __dirname, 'views' );
console.log( 'Views folder:', viewsPath );

//=============== Building Server ===============

function createServer(): Koa {
  let app: Koa = new Koa();
  app.keys = ["these", "strings", "are", "used", "sign", "cookies"];

  // koa-ejs
  render( app, {
    root: viewsPath,
    layout: false,
    viewExt: 'html',
    cache: false
  });

  app.on('error', ( err, ctx ) => {
    console.log( `Server Error: ${err.message} ` );
    console.log( `Server Error Code: ${err.status}`);
    console.log( `Server Error Stack:\n${err.stack}`);
  });

  // https://github.com/dlau/koa-body
  app.use( koaBody() );
  app.use( logger( _log ) );
  app.use( home.routes() );
  app.use( home.allowedMethods() );

  return app;
}

function start( port, host ): Promise<http.Server> {
  return new Promise(( resolve, reject ) => {
    try {
      log.info(`START - http://${host}:${port}`);

      const koaserver = createServer();
      const app : http.Server = koaserver.listen( port, host );
      resolve( app );
    }
    catch( error ) {
      reject( error );
    }
  });
}

start( 9001, 'localhost' )
.then( app => {
  log.info( 'OAuth2 Server Started' );
})
.catch( err => {
  log.error(err.message || err);
});
