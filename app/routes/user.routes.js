module.exports = app => {
    const users = require("../controllers/user.controller.js");

    let router = require("express").Router();

    // API for signup - Registerning new user
    router.post('/signup', users.signup)
    router.post('/signup/activate', users.activation)

    // API for login
    router.post('/login', users.login)

    // API for Google Oauth Trial
    router.post('/goauth', users.verify)

    // API for change Profile
    router.put('/update/', users.changeProfile)

    // API Base
    app.use("/api/v1/curapaska/us", router);
}