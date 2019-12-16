require("dotenv").config();
let clusterRateLimiter = require("./utils/clusterRateLimiter.js");
//const { createTransporter } = require("./utils/mailer.js");
const next = require("next");

const clusterLogic = require("./clusterLogic.js");
const serverLogic = require("./serverLogic.js");

const production = process.env.NODE_ENV === "production";
const dev = !production;

const app = next({ dev });
//makeScalable should be true for deployment
const runCluster = process.env.NODE_USE_CLUSTER === 'true';
const runClusterRateLimiter = process.env.NODE_USE_CLUSTER_RATE_LIMITER === 'true';
function init(app) {
  app
    .prepare()
    .then(function() {
      //const emailTransporter = await createTransporter();
      if(runCluster){
        console.log('running as cluster');
        if(runClusterRateLimiter){
          console.log('cluster rate limiting enabled');
          clusterLogic({ app, clusterRateLimiter }, serverLogic);
        } else {
          console.log('cluster rate limiting disabled');
          clusterLogic({ app }, serverLogic);
        }
        
      } else {
        console.warn('running without cluster or rate limiting');
        serverLogic({ app });
      }
    })
    .catch(err => {
      console.error("error starting app:", err);
    });
}
init(app);
