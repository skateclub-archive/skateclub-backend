const { configuration } = require("../../config");
const { loggerInstance } = require("../logger");
const { generateHash, pruneInterval, inactiveServerRemovalMs } = require("../utils"); // some utils
const crypto = require("../encryption")
const { discord } = require("../discord/discord");
const { getCountry } = require("../ipcountry");
const reporter = require("./reports")
// ------------
// Our server list object, We'll import it to any other file that needs it.
// Use this object to add/remove servers from the list. eg. knownServers.add(newServer);
// ------------
var ServerList = {
  _list: [],

  get list() {
    return this._list;
  },

  get playerCount() {
    var val = 0;

    this.list.forEach((server) => {
      val += server.players != null ? server.players : 0
    });

    return val;
  },

  sendList(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress//= req.ip
    // Shows if keys match for those getting list server details.
    loggerInstance.info(`${ip} accepted; communication key matched: '${req.body.serverKey}'`);

    // Clean out the old ones.
    this.prune();

    // A client wants the server list. Compile it and send out via JSON.
    var serverList = this._list.map((knownServer) => {
      var reports = reporter.reports.filter((report) => report.server.id == knownServer.id);
      return {
        id: knownServer.id,

        name: knownServer.name,
        description: knownServer.description,
        level: knownServer.level,
        
        country: knownServer.country,
        flag: knownServer.flag,

        extras: req.body.admin == configuration.Auth.adminPasscode ? 
        {
          ip: knownServer.ip,
          password: knownServer.password,

          reports: reports ? reports.map((report => report.report)) : [],

          banlist: knownServer.banlist,
          allowlist: knownServer.allowlist
        } : null,

        port: parseInt(knownServer.port, 10),
        players: parseInt(knownServer.players, 10),
        capacity: parseInt(knownServer.capacity, 10),

        hasPassword: knownServer.password == "" ? false : true
      };
    });

    // If dontShowServersOnSameIp is true, remove any servers that are on the same IP as the client.
    if (configuration.Pruning.dontShowServersOnSameIp) {
      serverList = serverList.filter((server) => server.ip !== ip);
    }

    // Build response with extra data with the server list we're about to send.
    var response = {
      count: serverList.length,
      players: this.playerCount,
      servers: serverList,
      updateFrequency: inactiveServerRemovalMs / 1000 / 2, // How often a game server should update it's listing
    };

    loggerInstance.info(`Replying to ${req.ip} with known server list.`);
    return res.json(response);
  },

  connectToServer(req, res) {
    if(!req.body.id)
      return res.status(400).send("Please provide ID");

    const servers = this._list.filter((server) => server.id === req.body.id);

    if(servers.length == 0)
      return res.status(400).send("Server not found");

    const server = servers[0];

    if(server.password != "" && req.body.password != server.password)
      return res.status(400).send("Incorrect password");

    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 

    if(server.banlist.includes(ip))
      return res.status(401).send("You've been banned from this server");

    if(server.allowlist.length > 0 && !server.allowlist.includes(ip))
      return res.status(401).send("You're not on this servers allow list");

    return res.send(server.ipcrypt);
  },

  // Add a new server to the list.
  addServer(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress //= req.ip
    // Our request validator already checks if a uuid exists
    // So we'll just check if there's a uuid in the request body and pass it to the update function
    if (this.list.filter((server) => server.ip === ip).length > 0)
      // Hand it over to the update routine.
      return this.updateServer(req, res);

    getCountry(ip).then((countryDetails) => {
      // Time to wrap things up.
      var newServer = {
        id: generateHash(ip).toString(), // The public ID for reporting

        ipcrypt: crypto.encrypt(ip, configuration.Encryption.AesKey), // AES-256-CBC Encrypted version of the ip, serve this to the client.
        ip: ip, // The raw IP, keep this private

        country: countryDetails.name,
        flag: countryDetails.flag,

        name: req.body.serverName.trim(),
        port: parseInt(req.body.serverPort, 10),
        
        banlist: req.body.banlist ? JSON.parse(req.body.banlist) : [],
        allowlist: req.body.allowlist ? JSON.parse(req.body.allowlist) : [],

        official: req.body.admin == configuration.Auth.adminPasscode ? true : false
      };

      // Extra field santitization
      newServer["players"] = req.body.serverPlayers ? parseInt(req.body.serverPlayers) : 0;
      newServer["capacity"] = req.body.serverPlayers ? parseInt(req.body.serverCapacity) : 0;
      newServer["level"] = req.body.level;
      newServer["description"] = req.body.serverDescription?.trim() || "";
      newServer["lastUpdated"] = Date.now();
      newServer["password"] = req.body.password || "";

      this._list.push(newServer);
      // Log it and send back the UUID to the client - they'll need it for later.
      loggerInstance.info(
        `Handled add server request from ${req.ip}: ('${newServer["name"]}')`
      );

      return res.sendStatus(200);
    });
  },

  // Update a server's details.
  updateServer(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    // Remove the server and save it to a variable
    const index = this._list.findIndex((server) => server.ip === ip);
    var [updatedServer] = this._list.splice(index, 1);

    // Create an object with our requestData data
    var requestData = {
      name: req.body.serverName?.trim(),
      description: req.body.serverDescription?.trim(),
      level: req.body.level?.trim(),

      players: parseInt(req.body.serverPlayers),
      capacity: parseInt(req.body.serverCapacity),

      password: req.body.password ? req.body.password : "",
      banlist: req.body.banlist ? JSON.parse(req.body.banlist) : [],
      allowlist: req.body.allowlist ? JSON.parse(req.body.allowlist) : [],
    
      lastUpdated: Date.now(),
    };

    // Cross-check the request data against our current server values and update if needed
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== updatedServer[key]) {
        updatedServer[key] = value;
      }
    });

    // Push the server back onto the stack.
    this._list.push(updatedServer);
    loggerInstance.info(
      `Handled update request for server ${req.ip} (${updatedServer.name})`
    );
    return res.sendStatus(200); // 200 OK
  },
  // removeServer: Removes a server from the list.
  removeServer(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    this._list = this.list.filter((server) => server.ip !== ip);
    loggerInstance.info(
      `Deleted server ${req.ip}`
    );
    return res.send("OK\n");
  },

  reportServer(req, res) {
        
    if(!req.body.id)
      return res.status(400).send("Please provide ID");

    const index = this.list.findIndex((server) => server.id === req.body.id);

    if(index == -1)
      return res.status(400).send("Server not found");

    var server = this.list[index];
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 

    var report = {
      server: {
        id: server.id,
        ip: server.ip,
        name: server.name,
        description: server.description
      },
      report: {
        sender: req.body.discord,
        reason: req.body.reason,
        ip: ip
      }
    };

    reporter.addReport(report);

    return res.sendStatus(200);
  },

  prune() {
    const oldLength = this.list.length;
    this._list = this._list.filter(
      (server) => server.lastUpdated + inactiveServerRemovalMs >= Date.now()
    );

    // if we removed any servers then log how many
    if (oldLength > this.list.length)
      loggerInstance.info(`Purged ${oldLength - this.list.length} old server(s).`);
  },

  // Automtically remove old servers if they haven't updated based on the time specified in the configuration
  async pruneLoop() {
    this.prune();
    await new Promise((resolve) => setTimeout(resolve, pruneInterval)); // async delay
    this.pruneLoop();
  },

  async updateBotLoop() {
    if(discord.user != null) {
      var serverCount = this.list.length;

      discord.user.setActivity(`with ${this.playerCount} players on ${serverCount} servers`);
    } 
    await new Promise((resolve) => setTimeout(resolve, 1000)); // async delay
    this.updateBotLoop();
  },

  getServerPruneTime(existingServer) {
    const lastUpdated = this.list.find((server) => server.ip == existingServer.ip)?.lastUpdated;
    const serverLife = (lastUpdated + (inactiveServerRemovalMs - Date.now())) / 1000;
    if (lastUpdated) return Math.ceil(serverLife + 1);
  }
};

// Start the first purge iteration
ServerList.pruneLoop();
ServerList.updateBotLoop();

module.exports = ServerList;
