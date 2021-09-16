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

const { OAuth2Client } = require('google-auth-library');

// Google Oauth
// Create and Save a New User (Signup)

async function verify(req,res) {
    // Token coba-coba niatania102
    let token = req.body.token; //supposedly get from frontend
    const client_id = '407408718192.apps.googleusercontent.com'; //get from frontend
    // const client_id = req.body.client_id; //supposedly get from frontend
    const client = new OAuth2Client(client_id);
    // try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: client_id,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        return payload;
    // } catch (error) {
    //     return error;
    // }
}

// Create and Save a New User (Signup)
const signup = (req,res) => {
    // Passing information from request
    const user = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password ? sha256(req.body.password) : null,
        fullName: req.body.fullName,
        gender: req.body.gender,
        birthdate: req.body.birthdate ? req.body.birthdate: null,
        phoneNumber: req.body.phoneNumber ? req.body.phoneNumber: null,
        status: req.body.status ? req.body.status: 'Active',
        certiFilename: req.body.certiFilename ? req.body.certiFilename: null,
        roleId: req.body.certiFilename ? 2 : 3
    }
    console.log('token: '+req.body.token);
    // Validate request
    if (req.body.token==null && (!user.username || !user.email || !user.password || !user.fullName)) {
        res.status(400).send({
            success: false,
            message: "Content cannot be empty"
        })
        return;
    }

    // If register with Google Oauth 2, no need to verify anymore because Google's verified it
    if(req.body.token){
        let verifResult = verify(req);
        verifResult.then(function(vResult) {
            console.log(vResult) // "Some User token"

            User.findOne( { where: { email: vResult.email }})
            .then((result) => {
                // Check if there is user or not
                if (result) {
                    res.status(400).send({
                        success: false,
                        message: "User already exists"
                    })
                }
                else{
                    if(vResult.email_verified == true){
                        const user = {
                            email: vResult.email,
                            fullName: vResult.name,
                            picture: vResult.picture,
                            roleId: req.body.certiFilename ? 2 : 3
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
                    }
                }
            })
            .catch((error) => {
            res.status(500).send(({
                success: false,
                message: error.message || "Some error occured while verifying token ID"
            }))
        })
        })
    }
    else{
    // Account hasn't been activated
    User.findOne({ where: {[Op.or]:
        [{username: user.username || ''}, {email: user.email}]}})
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
                        <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>`
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
        email: req.body.email,
        password: req.body.password ? sha256(sha256(req.body.password)) : null
    }

    // Checking information from database
    User.findOne({ where: {[Op.or]:
        [{username: checkUser.username}, {email: checkUser.email}]}})
        .then((result) => {

            // Check if there is user or not
            if (result) {
                const signed = {
                    username: result.username,
                    fullName: result.fullName,
                    email: result.email,
                    status: result.status
                }
                // Check if login with Google Oauth 2
                if(req.body.token){
                    let verifResult = verify(req);
                    verifResult.then(function(vResult) {
                        console.log(vResult) // "Some User token"
                        if(vResult.email_verified == true){
                            res.status(200).send({
                                success: vResult.email_verified,
                                message: "Login verified Google Oauth",
                                email: vResult.email
                            })
                        }
                     })
                     .catch((error) => {
                        res.status(500).send(({
                            success: false,
                            message: error.message || "Some error occured while verifying token ID"
                        }))
                     })
                }

                // Check if the password is correct or not
                else if(checkUser.password === result.password) {
                    const token = jwt.sign({ signed },
                        process.env.JWT_ACC_LOGGEDIN,
                        { expiresIn: '7d' })

                    res.status(200).send({
                        success: true,
                        message: "User logged in"
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

// Profile Update
const changeProfile = (req,res) => {
    const token = req.body.token

    if (token) {
        jwt.verify(token,
            process.env.JWT_ACC_LOGGEDIN,
            (err, decodedToken) => {
                if (err) return res.status(410).send({
                    success: false,
                    message: "Incorrect or Expired link."
                })

                username = decodedToken.signed.username

                const changed = {
                    birthdate: req.body.birthdate,
                    phoneNumber: req.body.phoneNumber
                }

                User.update(changed , { where : {username: username}})
                    .then((result) => {
                        res.status(200).send({
                            success: true,
                            message: 'Profile updated successfully'
                        })
                    })
                    .catch((err) => {
                        res.status(500).send({
                            success: false,
                            message:
                                err.message || "Some error occured while retrieving user data"
                        })
                    })
            })
    }
    else {
        res.status(400).send({
            success: false,
            message: "No token available"
        })
    }
}

module.exports = {
    signup,
    activation,
    login,
    changeProfile,
    verify
}
