module.exports = app => {
    const users = require("../controllers/user.controller.js");
    const roles = require('../controllers/role.controller')

    let router = require("express").Router();

    // API for signup - Registerning new user
    router.post('/signup', users.signup)
    router.post('/signup/activation', users.activation)

    // API for login
    router.post('/login', users.login)

    // API for role
    router.post('/role', roles.roleAddition)

    // API Base
    app.use("/api/v1/curapaska/us", router);   
}