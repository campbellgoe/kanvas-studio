require("dotenv").config();
const clusterRateLimiter = require("./utils/clusterRateLimiter.js");
//const { createTransporter } = require("./utils/mailer.js");
const next = require("next");

const clusterLogic = require("./clusterLogic.js");
const serverLogic = require("./serverLogic.js");

const production = process.env.NODE_ENV === "production";
const dev = !production;

const app = next({ dev });
//makeScalable should be true for deployment
const makeScalable = process.env.DEPLOY_STATUS === "live";
function init(app) {
  app
    .prepare()
    .then(function() {
      //const emailTransporter = await createTransporter();
      if(makeScalable){
        console.log('Running with cluster and rate limiting.', 'DEPLOY_STATUS:', process.env.DEPLOY_STATUS);
        clusterLogic({ clusterRateLimiter, app }, serverLogic);
      } else {
        console.warn('Running without cluster or rate limiting.', 'DEPLOY_STATUS:', process.env.DEPLOY_STATUS);
        serverLogic({ app });
      }
    })
    .catch(err => {
      console.error("error starting app:", err);
    });
}
init(app);
