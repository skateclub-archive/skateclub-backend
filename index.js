const express = require('express')
const app = express()

const serverListRouter = require("./routes/serverlist.router");
//const accountsRouter = require("./routes/accounts.router");

const port = process.env.PORT || 8889; 

app.get('/api/', (req,res) => res.send("API is online"))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/serverlist", serverListRouter);
//app.use("/api/account", accountsRouter);

app.listen(port, "0.0.0.0", () =>
  console.log(`Listening on ${port}`)
);
