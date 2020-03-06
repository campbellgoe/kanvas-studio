const { RateLimiterClusterMaster, RateLimiterCluster } = require('rate-limiter-flexible');
const numCPUs = require("os").cpus().length;
const maxRequests = process.env.RATE_LIMITER_REQUESTS * numCPUs;
const duration = process.env.RATE_LIMITER_SECONDS;

const clusterRateLimiter = isMaster => {
  if (isMaster) {
    console.log('isMaster in rateLimiter');
    console.log("Limiting to a maximum of", maxRequests, "requests per", duration, 'second(s) across', numCPUs, 'CPUs.');
    new RateLimiterClusterMaster();
  }
  return (req, res, next) => {
    if (!isMaster) {
      const rateLimiter = new RateLimiterCluster({
        keyPrefix: "middleware",
        points: maxRequests, // number of requests (change this based on max number of requests it makes)
        duration, // per x second(s) by IP
        timeoutMs: 5000,
      });
      rateLimiter
        .consume(req.ip)
        .then(() => {
          next();
        })
        .catch(() => {
          res.status(429).send("Too Many Requests");
        });
    }
  }
}
module.exports = clusterRateLimiter;
