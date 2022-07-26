const { Snowflake } = require('nodejs-snowflake');
const { configuration } = require("../config");
const crypto = require('crypto')

const uid = new Snowflake();

// Convert the inactiveServerRemovalMinutes to milliseconds
const inactiveServerRemovalMs = configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000;

// If we're going to send the remaining server life in seconds, we need to run the prune every second
// Otherwise , just run it half of whaterver the inactiveServerRemovalMinutes is set to.
const pruneInterval = configuration.Pruning.sendNextPruneTimeInSeconds
  ? 1000
  : inactiveServerRemovalMs / 2;

// Generates a UUID for a newly added server.
function generateID() {

  return uid.getUniqueID();
}

function generateHash(input) {
  return crypto.createHash('md5').update(input).digest("hex");
}

module.exports = { generateID, generateHash, inactiveServerRemovalMs, pruneInterval };
