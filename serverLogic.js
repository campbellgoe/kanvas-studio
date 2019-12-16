const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");
const device = require("device");
//const contactFormLogicFactory = require('./contactFormLogic.js');
const port = parseInt(process.env.PORT, 10) || 3000;
const production = process.env.NODE_ENV === "production";
const enableCaching = process.env.ENABLE_CACHING === "true";

function renderApp(app, req, res, pathOverride = "") {
  return app.render(req, res, pathOverride || (req.baseUrl || "") + req.path, {
    pageProps: {
      deviceType: device(req.headers["user-agent"]).type,
      ...res.locals
    }
  });
}
function serverLogic({ app, rateLimiter }) {
  const server = express();
  //setup helmet security middleware
  server.use(helmet());
  server.use(helmet.referrerPolicy({ policy: "same-origin" }));
  //Cotent-Security-Policy setup with helmet
  if (production) {
    server.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`],
          fontSrc: ["fonts.gstatic.com"],
          objectSrc: ["'none'"]
        }
      })
    );
  }
  if (production && enableCaching) {
    console.log("caching of static assets enabled.");
    server.get(/^\/_next\/static\/(images|fonts)\//, (_, res, nextHandler) => {
      res.setHeader("Cache-Control", "public, max-age=864000, immutable");
      nextHandler();
    });
    const staticPath = path.join(__dirname, "/static");
    server.use(
      "/static",
      express.static(staticPath, {
        maxAge: "10d",
        immutable: true
      })
    );
  }
  // add upgradeInsecureRequests helmet protection for https version

  // parse application/x-www-form-urlencoded
  server.use(bodyParser.urlencoded({ extended: false }));

  // parse application/json
  server.use(bodyParser.json());

  //rate limit all routes to help protect against DDOS
  if(rateLimiter) server.use(rateLimiter(false));

  //handle contact form
  //server.post("/contact", contactFormLogicFactory({ emailTransporter }));

  //specifically handle _error as a 404
  server.all("/_error", (req, res) => {
    res.status(404);
    return renderApp(app, req, res, "/_error");
  });

  //render routes based on files in /pages, and handle 404 for all routes not in /pages
  server.get("*", (req, res) => renderApp(app, req, res));

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}
module.exports = serverLogic;
