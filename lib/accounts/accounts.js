const User = require('../model/Account');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('./validation');

module.exports = {
    async register(req,res) {
        if(req.header('rpw') != process.env.REGISTER_PW) return res.status(400).send("No permission");

        // DATA VALIDATION
        const {error} = registerValidation(req.body);
        if(error) return res.status(400).send(error.details[0].message);

        // CHECK IF USER ALREADY EXISTS
        const nameExist = await User.findOne({name: req.body.name})
        if(nameExist) return res.status(400).send("Name already taken");

        // PASSWORD HASHING
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        // USER CREATION
        const user = new User({
            name: req.body.name,
            password: hashPassword
        });
        try {
            const savedUser = await user.save();
            res.send({user: user._id});
        } catch(error) {
            res.status(400).send(error);
        }
    },

    // LOGIN
    async login(req,res) {
        // DATA VALIDATION
        const {error} = loginValidation(req.body);
        if(error) return res.status(400).send(error.details[0].message);

        // CHECK IF NAME EXISTS
        const user = await User.findOne({name: req.body.name})
        if(!user) return res.status(400).send("Incorrect username or password");

        // PASSWORD VALIDATION
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if(!validPass) return res.status(400).send("Incorrect username or password");

        // CREATE AND ASSIGN JWT TOKEN
        const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET)
        res.header('auth-token', token).send(token);
    },
}