const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Models
const db = require("./app/models");

const app = express();

// Clients that can access the server (server and localhost 8071 can access)
let whiteList = [
    'http://localhost:8071',
];

// Cors configuration
let corsOptions = {
    origin: function (origin, callback) {
        if (whiteList.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
};

// Activate cors
app.use(cors(corsOptions));

// Parse requests of content-type - application/json
app.use(bodyParser.json());
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Sync database
db.sequelize.sync();

/* ROUTING PART */
// Users Routes
require("./app/routes/user.routes")(app);

// Roles Routes
require("./app/routes/role.routes")(app);

app.all('*', (req,res) => {
    res.status(404).send({
        success: false,
        message: 'Page Not Found'
    })
})

// Set port, listen for requests
const PORT = process.env.PORT || 8080;

// Activate server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
