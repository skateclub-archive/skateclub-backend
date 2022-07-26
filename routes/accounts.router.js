const router = require('express').Router();
const { login, register } = require("../lib/accounts/accounts")

router.post('/register', async (req,res) => register(req, res));
router.post('/login', async (req,res) => login(req, res));

module.exports = router;