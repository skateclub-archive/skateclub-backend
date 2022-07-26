const express = require('express')
const Serverlist = require("../lib/serverlist/serverList");
const router = express.Router()

const requestHandlers = require("../lib/serverlist/requestHandlers");
const { configuration } = require("../config");

const useRateLimiter =
  !configuration.Security.useRateLimiter || configuration.Security.useRateLimiter;

if (useRateLimiter) {
  const expressRateLimiter = require("express-rate-limit");
  const limiter = expressRateLimiter({
    windowMs: configuration.Security.rateLimiterWindowMs,
    max: configuration.Security.rateLimiterMaxApiRequestsPerWindow,
  });

  console.log("Security: Enabling the rate limiter module.");
  router.use(limiter);
}

// These are our gatekeepers, requests must pass through these before allowed to access the API.
router.use(requestHandlers.handleErrors);
router.use(requestHandlers.handleAllRequests);
router.use((req, res, next) =>
  requestHandlers.handlePathSpecificRequests(
    req,
    res,
    next,
    Serverlist.list
  )
);
// -- Start the application -- //
// Attach the functions to each path we use with NodeLS.
router.post("/list", (req, res) => Serverlist.sendList(req, res));
router.post("/register", (req, res) => Serverlist.addServer(req, res));
router.post("/remove", (req, res) => Serverlist.removeServer(req, res));
router.post("/report", (req, res) => Serverlist.reportServer(req, res));
router.post("/connect", (req, res) => Serverlist.connectToServer(req, res));

router.get("/playercount", (req, res) => res.send(Serverlist.playerCount.toString()));

module.exports = router;