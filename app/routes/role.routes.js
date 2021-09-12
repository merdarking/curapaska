module.exports = app => {
    const roles = require('../controllers/role.controller');

    let router = require("express").Router();

    // API for role
    router.post('/addition', roles.roleAddition)

    // API for getting role
    router.get('/list', roles.roleFindAll)

    app.use("/api/v1/curapaska/rl", router);
}