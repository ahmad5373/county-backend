const express = require("express");
const app =  express();
const cors = require("cors");
const dotenv = require("dotenv");
const connectionDB = require("../config/database");
const bodyParser  = require("body-parser");
const cookieParser = require("cookie-parser");
// const User = require("../src/routes/userRoutes");
const Goals = require("../src/routes/goalRoutes");

dotenv.config();

// add middlewares 
app.use(cors()) ;  //Middleware enable cors for frontend 
app.use(cookieParser());
app.use(bodyParser.json()); // Middleware that parse request body to json form 

connectionDB(); // call connection to db here 

//Default route
app.get('/' , (req,res)=>{
    res.send("Application is currently working !")
});

// using express middleware in this main file to call api
// app.use("/users", User);
app.use("/goals", Goals);

module.exports = app;
