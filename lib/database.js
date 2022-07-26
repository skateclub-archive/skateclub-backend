const mysql = require('mysql');
const { configuration } = require("../config");

var connection = mysql.createPool({
    host: configuration.Database.host,
    user: configuration.Database.user,
    password: configuration.Database.password,
    database: configuration.Database.database
});

module.exports = connection;