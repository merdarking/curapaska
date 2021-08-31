// Module dependencies
const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op; // option

require('dotenv').config();

const mailgun = require('mailgun-js');
const DOMAIN = process.env.DOMAIN;
const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });

const sha256 = require('sha256');
const jwt = require('jsonwebtoken');

// Create and Save a New User (Signup)
const signup = (req,res) => {
    // Passing information from request
    const user = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.fullName,
        gender: req.body.gender,
        birthdate: req.body.birthdate ? req.body.birthdate: null,
        phoneNumber: req.body.phoneNumber ? req.body.phoneNumber: null,
        status: req.body.status ? req.body.status: 'Active',
        certiFilename: req.body.certiFilename ? req.body.certiFilename: null,
        roleId: req.body.certiFilename ? 2 : 3
    }

    // Validate request
    if (!user.username || !user.email || !user.password || !user.fullName) {
        res.status(400).send({
            success: false,
            message: "Content cannot be empty"
        })
        return;
    }

    // Account hasn't been activated
    User.findOne({ where: {[Op.or]:
        [{username: user.username}, {email: user.email}]}})
        .then((result) => {
            if (result) {
                res.status(400).send({
                    success: false,
                    message: "User already exists"
                })
            }
            else {
                // JWT sign
                const token = jwt.sign({ user },
                    process.env.JWT_ACC_ACTIVATE,
                    { expiresIn: '20m' })

                // Send Activation Link
                const data = {
                    from: 'noreply@curapaska.com',
                    to: user.email,
                    subject: 'Account Activation Link',
                    html:
                        `<h2>Pleace click on the given link to activate your a>ccount</h2>
                        <p>${process.env.CLIENT_URL}/auth/activate/${token}</p`
                }
                mg.messages().send(data, (err,body) => {
                    if(err) return res.status(500).send({
                        success: false,
                        message:
                            err.message || "Some error occured when sending email"
                    })
                    res.status(200).json({
                        success: true,
                        message: "Email has been sent"
                    })
                })
            }
        })
        .catch((err) => {
            res.status(500).send({
                success: false,
                message:
                    err.message || "Some error occures while registering user"
            })
        })
}

// Account activation
const activation = (req,res) => {
    const { token } = req.body
    if (token) {
        jwt.verify(token,
            process.env.JWT_ACC_ACTIVATE,
            (err,decodedToken) => {
                if (err) return res.status(410).send({
                    success: false,
                    message: "Incorrect or Expired link."
                })
                const user = {
                    username: decodedToken.user.username,
                    email: decodedToken.user.email,
                    password: sha256(decodedToken.user.password),
                    fullName: decodedToken.user.fullName,
                    gender: decodedToken.user.gender,
                    birthdate: decodedToken.user.birthdate,
                    phoneNumber: decodedToken.user.phoneNumber,
                    status: decodedToken.user.status,
                    certiFilename: decodedToken.user.certiFilename,
                    roleId: decodedToken.user.roleId
                }
                User.create(user)
                    .then((data) => {
                        res.status(201).send({
                            success: true,
                            message: "Sign up successfully"
                        })
                    })
                    .catch((err) => {
                        res.status(500).send({
                            success: false,
                            message:
                                err.message || "Some error occured when creating the user"
                        })
                    })
            })
    }
    else {
        res.status(400).send({
            success: false,
            message: "No token available"
        });
    }
}

// Login user
const login = (req,res) => {
    var checkUser = {
        username: req.body.username,
        password: req.body.password
    }

    // Checking information from database
    User.findOne( { where: { username: checkUser.username }})
        .then((result) => {
            
            // Check if there is user or not
            if (result) {

                // Check if the password is correct or not
                if (checkUser.password === result.password) {
                    res.status(200).send({
                        success: true,
                        message: "User logged in",
                    })
                }
                else {
                    res.status(401).send({
                        success: false,
                        message: "Wrong password"
                    })
                }
            }
            else {
                res.status(401).send({
                    success: false,
                    message: "User doesn't exist"
                })
            }
        })
        .catch((err) => {
            res.status(500).send(({
                success: false,
                message:
                    err.message || "Some error occured while retrieving user data"
            }))
        })
}

module.exports = {
    signup,
    activation,
    login
}
