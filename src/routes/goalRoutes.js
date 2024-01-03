const express = require("express");
const Router = express.Router();

const goalController = require("../controller/goalController");
const auth = require("../middlewares/auth");

// Routes for Goal Operations
Router.post("/create", auth, goalController.createGoal); // Create Goal
Router.post("/create-goal-user-targets", auth, goalController.createGoalUserTarget); // Create Goal User Targets
Router.get("/", auth, goalController.getAllGoals); // Get all goals
Router.get("/ended-goals", auth, goalController.getAllEndedGoals); // Get all ended goals
Router.get("/ended-goals/:_id", auth, goalController.getEndedGoalsById); // Get ended goal with goalId
Router.get("/active-goals", auth, goalController.getActiveGoals); // Get Active Goals
Router.get("/upcoming-goals", auth, goalController.getUpcomingGoals); // Get Upcoming Goals
Router.get("/recruits-details/:userId/:goalId", auth, goalController.getRecruiterDetails); // Get Recruits Details For Goals
Router.get("/active-goals/:_id", auth, goalController.getActiveGoalsById); // Get Active Goal With User Id
Router.get("/:_id", auth, goalController.getGoalById); // Get Goal With Goal Id
Router.get('/stats/:_id', auth, goalController.getStats); // Get Goal Stats With Goal Id
Router.put("/:_id", auth, goalController.updateGoalById); // Update Goal
Router.delete("/end-goal/:_id", auth, goalController.endGoalById); // End Goal With Goal Id

module.exports = Router;
