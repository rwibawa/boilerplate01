import * as Router from 'koa-router';

const home: Router = new Router();
export default home;

home.get( '/', ctx => {
  const log = ctx.log.child({ func: 'home.GET' });
  log.info( `${ctx.method} - ${ctx.host} - ${ctx.path}` );
  
  return ctx.render( 'home' );
});