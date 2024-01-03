const express = require("express");
const Router = express.Router();

const goalController = require("../controller/goalController");
const auth = require("../middlewares/auth")

// Create Goal Routes
Router.post("/create", auth, goalController.createGoal);

// Create Goal User Targets Routes
Router.post("/create-goal-user-targets", auth, goalController.createGoalUserTarget);

// Get all goal routes
Router.get("/", auth, goalController.getAllGoals);

// Get all ended goal routes
Router.get("/ended-goals", auth, goalController.getAllEndedGoals);


// Get ended goal with goalId routes
Router.get("/ended-goals/:_id", auth, goalController.getEndedGoalsById);

// Get Active Goals Routes
Router.get("/active-goals", auth, goalController.getActiveGoals);

// Get upcoming Goals Routes
Router.get("/upcoming-goals", auth, goalController.getUpcomingGoals);

// Get Recruits Details For Goals Routes
Router.get("/recruits-details/:userId/:goalId", auth, goalController.getRecruiterDetails);

// Get Active Goal With User Id Route
Router.get("/active-goals/:_id", auth, goalController.getActiveGoalsById);

// Get Goal With Goal Id Route
Router.get("/:_id", auth, goalController.getGoalById);

// Get Goal Stats With Goal Id Routes
Router.get('/stats/:_id', auth, goalController.getStats);

//Update Goal Routes
Router.put("/:_id", auth, goalController.updateGoalById);

//End Goal With Goal Id Routes
Router.delete("/end-goal/:_id", auth, goalController.endGoalById);

module.exports = Router;
