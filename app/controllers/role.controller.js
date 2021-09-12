const db = require("../models");
const Role = db.roles;
const Op = db.Sequelize.Op;

// Create and Save a new Role
const roleAddition = (req,res) => {
    // Validate request
    if(!req.body.roleType) {
        res.status(400).send({
            success: false,
            message: "Content cannot be empty"
        })
        return;
    }

    // Create a Role
    const role = {
        roleType: req.body.roleType
    }

    // Save Role in the database
    Role.create(role)
        .then((result) => {
            res.status(201).send({
                success: true,
                message: "Role has been added",
                data: result
            })
        })
        .catch((err) => {
            res.status(500).send({
                success: false,
                message:
                    err.message || "Some error occured while creating role"
            })
        })
}

// Retrieve all Roles from the database
const roleFindAll = (req,res) => {
    Role.findAll()
        .then((result) => {
            res.status(200).send({
                success: true,
                message: "Listing all roles",
                data: result
            })
        })
        .catch((err) => {
            res.status(500).send({
                success: false,
                message:
                    err.message || "Some error occured while finding roles"
            })
        })
}

// Find a single Role with Id
const roleFindOne = (req,res) => {
    const id = req.params.id

    Role.findByPk(id)
        .then((result) => {
            res.status(200).send({
                success: true,
                message: `A role with id ${id} was found`,
                data: result
            })
        })
}

module.exports = {
    roleAddition,
    roleFindAll
}