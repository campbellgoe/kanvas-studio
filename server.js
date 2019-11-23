require("dotenv").config();
const clusterRateLimiter = require("./utils/clusterRateLimiter.js");
//const { createTransporter } = require("./utils/mailer.js");
const next = require("next");

const clusterLogic = require("./clusterLogic.js");
const serverLogic = require("./serverLogic.js");

const production = process.env.NODE_ENV === "production";
const dev = !production;

const app = next({ dev });

function init(app) {
  app
    .prepare()
    .then(function() {
      //const emailTransporter = await createTransporter();
      clusterLogic({ clusterRateLimiter, app }, serverLogic);
    })
    .catch(err => {
      console.error("error starting app:", err);
    });
}
init(app);
