// VALIDATION
const Joi = require('@hapi/joi');

module.exports = {
    // REGISTER VALIDATION
    registerValidation(data) {
        const schema = Joi.object({
            name: Joi.string().min(6).required(),
            password: Joi.string().min(6).max(1024).required()
        });

        return schema.validate(data);
    },

    // LOGIN VALIDATION
    loginValidation(data) {
        const schema = Joi.object({
            name: Joi.string().min(6).required(),
            password: Joi.string().min(6).max(1024).required()
        });

        return schema.validate(data);
    }
}