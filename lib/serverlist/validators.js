//-------
// Validators: Put request validators to be used in the requestHandler module here
// They should return an object with the following properties:
// passed: boolean - true if the request passed, false if not
// message: string - To log the message to the console
// status: number - To return a specific response status code to the client
//-------

const database = require("../database")

var banRecord;

function updateBanRecord() {
  database.query("select * from bannedips", (err, res) => {
    banRecord = res.map((record) => record.ip);
  });
  
}

updateBanRecord();


// No post body check
function requestIncludesBody(req) {
  if (!req.body) {
    return {
      passed: false,
      message: `Request to "${req.path}" denied from ${req.ip}: No POST body data?`,
      status: 400,
    };
  }
}

function accessControlCheck(req) {

  updateBanRecord();

  if (banRecord && banRecord.includes(req.ip)) {
    return {
      passed: false,
      message: `Your IP has been banned`,
      status: 401,
    };
  }
}

// Uuid provided but doesn't exist (/add).
function serverIPDoesNotExist(req, serverArray) {
  var ip = req.socket.remoteAddress
  if (!serverArray.some((server) => server.ip == req.ip)) {
    return {
      passed: false,
      message: `Request to "${req.path}" from ${req.ip} denied: No such server with IP '${ip}'`,
      status: 400,
    };
  }
}

// Server Name checking (/add)
function serverNameCheck(req, serverArray) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  // If no uuid provided, means client is trying ot add a server
  if (!req.body.serverName) {
    return {
      passed: false,
      message: `Request from ${req.ip} denied: Server name is null/undefined.`,
      status: 400,
    };
  }
  if (
    serverArray.some((server) => server.name === req.body.serverName.trim() && server.ip !== ip)
  ) {
    return {
      passed: false,
      message: `Request from ${req.ip} denied: Server name is already taken by another server.`,
      status: 400,
    };
  }
}

// Valid port provided?
function serverPortCheck(req) {
  // Now we need to check to ensure the server port isn't out of bounds.
  // Port 0 doesn't exist as per se, so we need to make sure we're valid.
  if (
    !req.body.serverPort ||
    isNaN(req.body.serverPort) ||
    req.body.serverPort < 1 ||
    req.body.serverPort > 65535
  ) {
    return {
      passed: false,
      message: `Request from ${req.ip} denied: Server port is undefined, below 1 or above 65335.`,
      status: 400,
    };
  }
}

module.exports = {
  serverIPDoesNotExist,
  serverNameCheck,
  serverPortCheck,
  requestIncludesBody,
  accessControlCheck,
};
