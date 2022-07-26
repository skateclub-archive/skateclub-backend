// Require the necessary discord.js classes
const Discord = require('discord.js');
const { configuration } = require('../../config');
const { loggerInstance } = require("../logger");

// Create a new client instance
const discord = new Discord.Client({ intents: [
    Discord.GatewayIntentBits.Guilds,
    // ...
] });

// When the client is ready, run this code (only once)
discord.once('ready', () => {
	console.log('Discord bot is online');
});

// Login to Discord with your client's token
discord.login(configuration.Discord.botToken);

module.exports = 
{
  discord,
  sendReportMessage(report) {
      discord.channels.fetch('REMOVED').then((channel) => {

        loggerInstance.info(`${report.report.sender} has reported the server "${report.server.name}" (${report.server.ip})`);

        const embed = {
            title: 'SERVER REPORT',
            color: 16711680,
            author: {
              name: `Reported by: ${report.report.sender || "No Discord ID"} (${report.report.ip})`
            },
            fields: [
              {
                name: 'Report Reason',
                value: report.report.reason || "No reason provided"
              },
              {
                name: 'Server ID',
                value: report.server.id
              },
              {
                name: 'Address',
                value: report.server.ip
              },
              {
                name: 'Name',
                value: report.server.name
              },
              {
                name: 'Description',
                value: report.server.description || "No description"
              }
            ]
          };

        channel.send({ embeds: [embed] });
      });
  }
}