const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
function clusterLogic({clusterRateLimiter, ...data}, cb) {
  if (cluster.isMaster) {
    //tell rate limiter to initialise master rate limiter code
    if(clusterRateLimiter) clusterRateLimiter(true);
    console.log(`Master ${process.pid} is running`);

    // Fork initial workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", worker => {
      console.log(`worker ${worker.process.pid} died, forking...`);
      cluster.fork();
    });

    cluster.on("online", worker => {
      console.log(`worker ${worker.process.pid} online`);
    });
  } else {
    //use rateLimiter in express middleware (workers)
    cb({rateLimiter: clusterRateLimiter, ...data});
  }
}
module.exports = clusterLogic;