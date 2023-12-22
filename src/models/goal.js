const mongoose = require("mongoose");

const GoalUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    goalNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

const GoalSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reward: {
      type: String,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    repeat: {
      type: Boolean,
    },
    status: {
      type: Boolean,
      default: true
    },
    goalUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GoalUser",
      },
    ],
  },
  { timestamps: true }
);


const GoalUserTargetsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoalUser",
      required: true,
    },
    goal_users_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    recruit_name: { type: String, required: true },
    recruited_at: { type: Date, required: true },
  },
  { timestamps: true }
);


const GoalUserTargets = mongoose.model("GoalUserTargets", GoalUserTargetsSchema);
const Goal = mongoose.model("Goal", GoalSchema);
const GoalUser = mongoose.model("GoalUser", GoalUserSchema);

module.exports = { Goal, GoalUser ,GoalUserTargets };
