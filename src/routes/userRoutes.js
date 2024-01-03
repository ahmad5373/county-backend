const express = require("express");
const Router = express.Router();
const userController = require("../controller/userController");
const Auth = require("../middlewares/auth");

// Middleware for checking frontend input
const validateUser = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    // Email validation for correct email format ("fobar@gmail.com")
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    
    // Check if the email format is valid
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format, please provide a valid email" });
    }
    next();
};


// Routes
Router.post("/signup", validateUser, userController.signup); 
Router.post("/login", validateUser, userController.login);
Router.post("/create", Auth, userController.createUser); 
Router.get("/", Auth, userController.getAllUser); 
Router.get("/:_id", Auth, userController.getUserById); 
Router.put("/:_id", Auth, userController.updateUser);
Router.put("/change-password/:_id", Auth, userController.changePassword); 
Router.put("/reset-password/:_id", Auth, userController.resetPassword);
Router.post("/forgot-password", userController.forgetPassword); 
Router.post("/first-reset-password", userController.firstResetPassword); 
Router.patch("/status/:_id", Auth, userController.changeStatus);
Router.delete("/soft-delete/:_id", Auth, userController.softDelete); 
Router.delete("/permanent-delete/:_id", Auth, userController.permanentDelete);
Router.get("/active-goal-recruits-details/:_id", Auth, userController.getActiveGoalWithRecruits); 
Router.get("/user-stats/:_id", Auth, userController.getUserStats);
Router.get("/user-ended-goals/:_id", Auth, userController.getUserEndedGoals);

module.exports = Router;
