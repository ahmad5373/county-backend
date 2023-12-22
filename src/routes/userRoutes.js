const express = require("express");

const Router = express.Router();
const userController = require("../controller/userController")
const Auth = require("../middlewares/auth"); // import Auth middleware to check token for user that allow user to perform any action

// middleware for check frontend input
const validateUser = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password is required" });
    }
    //email validation for correct email format ("fobar@gmail.com")
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
        return res
            .status(400)
            .json({ error: "Invalid email format please Provide valid email" });
    }
    next();
};


//SignUp User Route
Router.post("/signup", validateUser, userController.signup)

// Login User Route  
Router.post("/login", validateUser, userController.login)

// Create User Routes
Router.post("/create", Auth, userController.createUser)

//Get All Users Routes
Router.get("/", Auth, userController.getAllUser)

//Get User with Id  Routes
Router.get("/:_id", Auth, userController.getUserById)

//Update User with Id  Routes
Router.put("/:_id", Auth, userController.updateUser)


// Update User Password With UserId Routes
Router.put("/change-password/:_id", Auth, userController.changePassword);

// Reset User Password With UserId Routes
Router.put("/reset-password/:_id", Auth, userController.resetPassword);

// Forgot Password  Routes
Router.post("/forgot-password",  userController.ForgetPassword);

// Reset Password With forgot password Token 
Router.post("/first-reset-password",  userController.firstResetPassword);

//Update User status with Id Routes
Router.patch("/status/:_id", Auth, userController.changeStatus)

//Soft Delete With userId Routes
Router.delete("/soft-delete/:_id", Auth, userController.softDelete);

//Permanent Delete With userId Routes
Router.delete("/permanent-delete/:_id", Auth, userController.permanentDelete);

//Get Active Goal on the User Side With Recruits
Router.get("/active-goal-recruits-details/:_id", Auth, userController.getActiveGoalWithRecruits);

//Get User Stats With User Id 
Router.get("/user-stats/:_id", Auth, userController.GetUserStats);


module.exports = Router;