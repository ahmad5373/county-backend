const { Goal, GoalUser, GoalUserTargets } = require('../models/goal');
const { default: mongoose } = require('mongoose');
const User = require("../models/user");


// Create a new goal
exports.createGoal = async (req, res) => {
    try {
        const adminRole = req.user.user.role;
        // Only Super Admins and Admins can create a new Goal
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }
        const { startDate, endDate, reward, bonus, repeat, status, user } = req.body;
        if (!user) {
            return res.status(400).json({ error: 'user is required for creating a goal.' });
        }

        // Find active and upcoming goals
        const activeGoal = await Goal.findOne({ startDate: { $lte: new Date() }, endDate: { $gte: new Date() }, status: true, });
        const upComingGoal = await Goal.findOne({ startDate: { $gt: new Date() }, status: true });

        if (!activeGoal && !upComingGoal) {
            if (repeat === false) {
                const newGoal = await Goal.create({ startDate, endDate, reward, bonus, repeat, status });
                const usersData = []; // Initialize an array to store user data in the response
                const newGoalId = newGoal._id.toString();
                for (const userObj of user) {
                    if (!userObj.userId) {
                        return res.status(400).json({ error: 'userId is required for each user object.' });
                    }
                    const { userId, goalNumber } = userObj;
                    // Create a new goal user for each userId
                    const newGoalUser = await GoalUser.create({ userId, goalId: newGoalId, goalNumber });
                    usersData.push({
                        userId: userId,
                        goalId: newGoalId, // Use the generated _id from the newGoal
                        goalNumber: goalNumber,
                    });
                    // Push the entire newGoalUser into the 'goalUsers' array in the corresponding 'Goal' document
                    newGoal.goalUsers.push(newGoalUser);
                }
                await newGoal.save();
                const resData = {
                    startDate: newGoal.startDate,
                    endDate: newGoal.endDate,
                    reward: newGoal.reward,
                    bonus: newGoal.bonus,
                    repeat: newGoal.repeat,
                    users: usersData, // Use the accumulated user data
                };
                res.status(201).json(resData);
            } else {
                // repeat is true
                const initialGoal = await Goal.create({ startDate, endDate, reward, bonus, repeat, status });
                const usersData = [];
                const initialGoalId = initialGoal._id.toString();
                for (const userObj of user) {
                    if (!userObj.userId) {
                        return res.status(400).json({ error: 'userId is required for each user object.' });
                    }
                    const { userId, goalNumber } = userObj;
                    const initialGoalUser = await GoalUser.create({ userId, goalId: initialGoalId, goalNumber });
                    usersData.push({
                        userId: userId,
                        goalId: initialGoalId,
                        goalNumber: goalNumber,
                    });
                    // Push the entire initialGoalUser into the 'goalUsers' array in the corresponding 'Goal' document
                    initialGoal.goalUsers.push(initialGoalUser);
                }
                await initialGoal.save();

                // Calculate the difference between startDate and endDate
                const dateDifference = initialGoal.endDate.getTime() - initialGoal.startDate.getTime();

                // Create one more goal with an extended date range and assign the same users
                const secondGoalStartDate = new Date(initialGoal.endDate);
                secondGoalStartDate.setDate(secondGoalStartDate.getDate() + 1); // Add 1 day

                const secondGoalEndDate = new Date(secondGoalStartDate);
                secondGoalEndDate.setTime(secondGoalEndDate.getTime() + dateDifference);

                const secondGoal = await Goal.create({
                    startDate: secondGoalStartDate,
                    endDate: secondGoalEndDate,
                    reward,
                    bonus,
                    repeat,
                    status,
                });

                const secondGoalId = secondGoal._id.toString();
                for (const userObj of user) {
                    const { userId, goalNumber } = userObj;

                    // Create a new goal user for each userId
                    const secondGoalUser = await GoalUser.create({
                        userId,
                        goalId: secondGoalId,
                        goalNumber,
                    });

                    // Push the entire secondGoalUser into the 'goalUsers' array in the corresponding 'Goal' document
                    secondGoal.goalUsers.push(secondGoalUser);
                }
                await secondGoal.save();
                const resData = {
                    startDate: initialGoal.startDate,
                    endDate: initialGoal.endDate,
                    reward: initialGoal.reward,
                    bonus: initialGoal.bonus,
                    repeat: initialGoal.repeat,
                    users: usersData,
                };
                res.status(201).json(resData);
            }
        } else if (!activeGoal && upComingGoal) {
            // No active goal but upcoming goal exists
            if (repeat === false) {
                upComingGoal.status = false;  // End the upcoming goal
                await upComingGoal.save();
                const newGoal = await Goal.create({ startDate, endDate, reward, bonus, repeat, status }); // Create a new goal
                const usersData = [];
                const newGoalId = newGoal._id.toString();
                for (const userObj of user) {
                    // Check if userId property exists in the current user object
                    if (!userObj.userId) {
                        return res.status(400).json({ error: 'userId is required for each user object.' });
                    }
                    const { userId, goalNumber } = userObj;
                    // Create a new goal user for each userId
                    const newGoalUser = await GoalUser.create({ userId, goalId: newGoalId, goalNumber });
                    usersData.push({
                        userId: userId,
                        goalId: newGoalId, // Use the generated _id from the newGoal
                        goalNumber: goalNumber,
                    });
                    // Push the entire newGoalUser into the 'goalUsers' array in the corresponding 'Goal' document
                    newGoal.goalUsers.push(newGoalUser);
                }
                await newGoal.save();
                const resData = {
                    startDate: newGoal.startDate,
                    endDate: newGoal.endDate,
                    reward: newGoal.reward,
                    bonus: newGoal.bonus,
                    repeat: newGoal.repeat,
                    users: usersData, // Use the accumulated user data
                };

                res.status(201).json(resData);
            } else {
                // repeat is true
                const initialGoal = await Goal.create({ startDate, endDate, reward, bonus, repeat, status });
                const usersData = [];
                const initialGoalId = initialGoal._id.toString();
                for (const userObj of user) {
                    if (!userObj.userId) {
                        return res.status(400).json({ error: 'userId is required for each user object.' });
                    }
                    const { userId, goalNumber } = userObj;
                    const initialGoalUser = await GoalUser.create({ userId, goalId: initialGoalId, goalNumber });
                    usersData.push({
                        userId: userId,
                        goalId: initialGoalId,
                        goalNumber: goalNumber,
                    });
                    initialGoal.goalUsers.push(initialGoalUser);
                }

                await initialGoal.save();

                // Calculate the difference between startDate and endDate
                const dateDifference = initialGoal.endDate.getTime() - initialGoal.startDate.getTime();

                // Create one more goal with an extended date range and assign the same users
                const extendedEndDate = new Date(initialGoal.endDate);
                extendedEndDate.setTime(extendedEndDate.getTime() + dateDifference + 1); // Add 1 day

                const secondGoal = await Goal.create({
                    startDate: extendedEndDate,
                    endDate: new Date(extendedEndDate),
                    reward,
                    bonus,
                    repeat,
                    status,
                });

                const secondGoalId = secondGoal._id.toString();

                // Iterate through each object in the user array
                for (const userObj of user) {
                    const { userId, goalNumber } = userObj;

                    // Create a new goal user for each userId
                    const secondGoalUser = await GoalUser.create({
                        userId,
                        goalId: secondGoalId,
                        goalNumber,
                    });

                    // Push the entire secondGoalUser into the 'goalUsers' array in the corresponding 'Goal' document
                    secondGoal.goalUsers.push(secondGoalUser);
                }

                await secondGoal.save();

                // Response data to send
                const resData = {
                    startDate: initialGoal.startDate,
                    endDate: initialGoal.endDate,
                    reward: initialGoal.reward,
                    bonus: initialGoal.bonus,
                    repeat: initialGoal.repeat,
                    users: usersData, // Use the accumulated user data
                };

                res.status(201).json(resData);
            }
        } else {
            // Active goal exists
            console.log("Active goal already exists");
            res.status(200).json({ message: "Active goal already exists" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Create New Goal User Target
exports.createGoalUserTarget = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        const { goalId, userId, recruit_name, recruited_at } = req.body;

        // Only Super Admins , Admins and user themselves can create new GoalUserTargets
        if (adminRole !== 1 && adminRole !== 2 && req.user.user.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }

        // Check if goalId and userId are provided
        if (!goalId || !userId) {
            return res.status(400).json({ error: 'goalId and userId are required for creating a goal user target.' });
        }
        // Check if the provided goalId and userId exist
        const goal = await Goal.findById(goalId);
        const user = await User.findById(userId);
        if (!goal || !user) {
            return res.status(404).json({ error: 'Goal or User not found.' });
        }
        if (!goal.status) {
            return res.status(400).json({ error: 'Cannot create a goal user target for an inactive goal.' });
        }
        const goalUser = await GoalUser.findOne({ goalId, userId });
        if (!goalUser) {
            return res.status(404).json({ error: 'GoalUser not found.' });
        }
        // Create a new goal user target
        const newGoalUserTarget = await GoalUserTargets.create({
            userId,
            goalId,
            goal_users_id: goalUser._id,
            recruit_name,
            recruited_at,
        });
        res.status(201).json({ success: "GoalUserTarget create Successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get All Goals With Associated Users
exports.getAllGoals = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        // Only Super Admins and Admins can get all Goal
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }

        // Populate the 'goalUsers' array in the 'Goal' documents to get associated users
        const goals = await Goal.find({ status: true }).populate('goalUsers');
        if (goals.length > 0) {
            // Map the goals to the desired response structure
            const goalsData = goals.map(goal => ({
                startDate: goal.startDate,
                endDate: goal.endDate,
                reward: goal.reward,
                bonus: goal.bonus,
                repeat: goal.repeat,
                users: goal.goalUsers.map(goalUser => ({
                    userId: goalUser.userId,
                    goalId: goalUser.goalId,
                    goalNumber: goalUser.goalNumber
                }))
            }));
            res.status(200).json(goalsData);
        } else {
            res.status(200).json(goals);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get All Ended Goals With Associated Users
exports.getAllEndedGoals = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        // Only Super Admins and Admins can get all Goal
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }
        // Populate the 'goalUsers' array in the 'Goal' documents to get associated users
        const goals = await Goal.find({
            $or: [
                { status: false },
                { endDate: { $lt: new Date() } }
            ]
        }).populate('goalUsers');
        if (!goals) { return res.status(404).json({ error: "No Goals Found." }) }
        if (goals.length > 0) {
            // Map the goals to the desired response structure
            const goalsData = goals.map(goal => ({
                startDate: goal.startDate,
                endDate: goal.endDate,
                reward: goal.reward,
                bonus: goal.bonus,
                repeat: goal.repeat,
                users: goal.goalUsers.map(goalUser => ({
                    userId: goalUser.userId,
                    goalId: goalUser.goalId,
                    goalNumber: goalUser.goalNumber
                }))
            }));
            res.status(200).json(goalsData);
        } else {
            res.status(200).json(goals);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get Ended Goals And Users Data  with  User Id 
exports.getUserEndedGoals = async (req, res) => {
    try {
        const userId = req.params._id;
        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }
        const adminRole = req.user.user
        // Only Super Admins and Admins can get all Goal
        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }
        // Step 1: Find GoalUser  With Given userId
        const userGoalDocs = await GoalUser.find({ userId });
        // Step 2: Get the goalIds from the found GoalUser documents
        const goalIds = userGoalDocs.map(userGoal => userGoal.goalId);
        // Step 3: Find the associated Goal documents based on goalIds
        const goals = await Goal.find({
            $and: [
                {
                    $or: [
                        { status: false },
                        { endDate: { $lt: new Date() } }
                    ]
                },
                { _id: { $in: goalIds } }
            ]
        }).populate('goalUsers');

        if (!goals) {
            return res.status(404).json({ error: "No Goals Found." })
        }

        if (goals.length > 0) {
            // Map the goals to the desired response structure
            const goalsData = goals.map(goal => ({
                startDate: goal.startDate,
                endDate: goal.endDate,
                reward: goal.reward,
                bonus: goal.bonus,
                repeat: goal.repeat,
                users: goal.goalUsers.map(goalUser => ({
                    userId: goalUser.userId,
                    goalId: goalUser.goalId,
                    goalNumber: goalUser.goalNumber
                }))
            }));
            res.status(200).json(goalsData);
        } else {
            res.status(200).json(goals);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get Active  Goals
exports.getActiveGoals = async (req, res) => {
    try {
        const adminRole = req.user.user.role;
        // Only Super Admins, Admins, and the user themselves can view goal details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view goals" });
        }
        // Find active goals where the current date is within the start and end date range
        const activeGoals = await Goal.findOne({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            status: true, // Assuming status is also true for active goals
        }).populate('goalUsers');

        if (!activeGoals) { return res.status(404).json({ error: "No Active Goals Found." }) }
        // Assuming you have the goalId and userId variables available
        const goalId = activeGoals ? activeGoals._id : null;  // Replace with the actual goalId
        const userIds = activeGoals ? activeGoals.goalUsers.map(goalUser => goalUser.userId) : [];

        // Find the last updated information for each user
        const lastUpdatedInfo = await GoalUserTargets.aggregate([
            {
                $match: {
                    goalId,
                    userId: { $in: userIds }
                }
            },
            {
                $sort: { recruited_at: -1 }
            },
            {
                $group: {
                    _id: "$userId",
                    latestUpdate: { $first: "$$ROOT" }
                }
            }
        ]);
        const activeGoalsData = {
            _id: activeGoals._id,
            startDate: activeGoals.startDate,
            endDate: activeGoals.endDate,
            reward: activeGoals.reward,
            bonus: activeGoals.bonus,
            repeat: activeGoals.repeat,
            createdAt: activeGoals.createdAt,
            updatedAt: activeGoals.updatedAt,
            users: await Promise.all(activeGoals.goalUsers.map(async goalUser => {
                // console.log("goals users", goalUser);
                const user = await User.findById(goalUser.userId);
                const userLastUpdatedInfo = lastUpdatedInfo.find(
                    (info) => info._id.toString() === goalUser.userId.toString()
                );
                const lastUpdated = userLastUpdatedInfo ? userLastUpdatedInfo.latestUpdate.updatedAt : null;
                return {
                    _id: goalUser._id,
                    userId: goalUser.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    goalNumber: goalUser.goalNumber,
                    createdAt: goalUser.createdAt,
                    updatedAt: goalUser.updatedAt,
                    lastUpdated
                };
            })),
        }
        res.status(200).json(activeGoalsData);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get Upcoming Goals
exports.getUpcomingGoals = async (req, res) => {
    try {
        const adminRole = req.user.user.role;
        // Only Super Admins, Admins, and the user themselves can view goal details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view goals" });
        }

        // Find upcoming goals where the start date is after the current date
        const upcomingGoals = await Goal.findOne({
            startDate: { $gt: new Date() },
            status: true,
        }).populate('goalUsers');

        if (!upcomingGoals) { return res.status(404).json({ error: "No Upcoming Goals Found." }) }

        // Map the upcoming goals to the desired response structure
        const upcomingGoalsData = {
            _id: upcomingGoals._id,
            startDate: upcomingGoals.startDate,
            endDate: upcomingGoals.endDate,
            reward: upcomingGoals.reward,
            bonus: upcomingGoals.bonus,
            repeat: upcomingGoals.repeat,
            createdAt: upcomingGoals.createdAt,
            updatedAt: upcomingGoals.updatedAt,
            users: await Promise.all(upcomingGoals.goalUsers.map(async goalUser => {
                const user = await User.findById(goalUser.userId);
                return {
                    _id: goalUser._id,
                    userId: goalUser.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    goalNumber: goalUser.goalNumber,
                    createdAt: goalUser.createdAt,
                    updatedAt: goalUser.updatedAt,
                };
            })),
        }
        res.status(200).json(upcomingGoalsData);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get Recruiter Details With Goal And User ID
exports.getRecruiterDetails = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        // Only Super Admins and Admins can get all Goal
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }

        const { goalId, userId } = req.body;
        // Validate if goalId and userId are provided
        if (!goalId || !userId) {
            return res.status(400).json({ error: 'Both goalId and userId are required parameters.' });
        }
        const goal = await Goal.findById(goalId); // Find the goal by goalId
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found.' });
        }

        // Find all recruits from GoalUserTargets where goalId and userId match
        const recruits = await GoalUserTargets.find({ goalId, userId });
        const responseData = {
            _id: goal._id,
            startDate: goal.startDate,
            endDate: goal.endDate,
            reward: goal.reward,
            bonus: goal.bonus,
            repeat: goal.repeat,
            status: goal.status,
            recruits: recruits.map(recruit => ({
                _id: recruit._id,
                recruiterName: recruit.recruit_name,
                recruiterAt: recruit.recruited_at
            })),
        };
        res.status(200).json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get active goals with user Id
exports.getActiveGoalsById = async (req, res) => {
    try {

        const adminRole = req.user.user
        const userId = req.params._id
        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        // Only Super Admins and Admins,  can permanent delete user 
        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to Delete this user" });
        }

        // Find the GoalUser entry for the logged-in user
        const goalUser = await GoalUser.findOne({
            userId: userId,
        });
        if (!goalUser || goalUser === null) {
            return res.status(404).json({ error: "No goal data found." })
        }

        const activeGoals = await Goal.find({
            _id: goalUser.goalId, // Filter by the provided goal ID
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            status: true, // Assuming status is also true for active goals
        }).populate('goalUsers');

        if (!activeGoals || activeGoals.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        // Map the active goals to the desired response structure
        const activeGoalsData = activeGoals.map(goal => ({
            startDate: goal.startDate,
            endDate: goal.endDate,
            reward: goal.reward,
            bonus: goal.bonus,
            repeat: goal.repeat,
            users: goal.goalUsers.map(goalUser => ({
                userId: goalUser.userId,
                goalId: goalUser.goalId,
                goalNumber: goalUser.goalNumber
            }))
        }));

        res.status(200).json(activeGoalsData);
    } catch (error) {
        console.log("err", error);
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


// Get a single goal by ID with associated users
exports.getGoalById = async (req, res) => {
    try {
        const goalId = req.params._id;
        const adminRole = req.user.user.role

        // Only Super Admins, Admins, and the user themselves can view goals details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this Goal" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(goalId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }
        const goal = await Goal.findById(goalId);
        const goalUsers = await GoalUser.find({ goalId: goalId })

        if (!goal || goal.status === false) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goalData = {
            startDate: goal.startDate,
            endDate: goal.endDate,
            reward: goal.reward,
            bonus: goal.bonus,
            repeat: goal.repeat,
            users: goalUsers.map(goalUser => ({
                userId: goalUser.userId,
                goalId: goalUser.goalId,
                goalNumber: goalUser.goalNumber
            }))
        };
        res.status(200).json(goalData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


exports.updateGoalById = async (req, res) => {
    try {
        const goalId = req.params._id;
        const adminRole = req.user.user.role

        // Only Super Admins, Admins, and the user themselves can view user details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this user" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(goalId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const updatedGoal = await Goal.findByIdAndUpdate(goalId, req.body, { new: true });
        if (!updatedGoal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        // Find the goal and populate goalUsers
        let goal = await Goal.findById(goalId);
        let goalUsers = await GoalUser.find({ goalId: goalId });

        const incomingData = req.body;
        // Check if user object  are provided in the request body
        if (incomingData.users) {
            // Update existing users and add new users
            await Promise.all(incomingData.users.map(async (incomingUser) => {
                const existingUser = goalUsers.find(
                    user => user.userId.toString() === incomingUser.userId.toString() && user.goalId.toString() === goalId
                );

                if (existingUser) {
                    // Update existing user with a new goalNumber
                    existingUser.goalNumber = incomingUser.goalNumber;
                    await GoalUser.findByIdAndUpdate(existingUser._id, { goalNumber: incomingUser.goalNumber });
                } else {
                    // Create a new GoalUser  for the new user
                    const newUser = await GoalUser.create({
                        userId: incomingUser.userId,
                        goalId: goalId,
                        goalNumber: incomingUser.goalNumber
                    });
                    goal.goalUsers.push(newUser._id);
                }
            }));

            // Remove missing users
            goalUsers = await Promise.all(goalUsers.filter(async (existingUser) => {
                const incomingUser = incomingData.users.find(
                    user => user.userId.toString() === existingUser.userId.toString()
                );
                if (!incomingUser) {
                    // Remove from GoalUser collection
                    const removeID = await GoalUser.findByIdAndDelete(existingUser._id);
                    await Goal.findByIdAndUpdate(goalId, {
                        $pull: { goalUsers: removeID._id } // Remove from goal.goalUsers using $pull
                    });
                    return null;
                }
                // Keep the user if present in the incoming data
                return incomingUser;
            }));
            // Filter out null values (users to be removed) from goalUsers array
            goalUsers = goalUsers.filter(user => user !== null);

        }

        // Save the updated goal
        await goal.save();

        // Refetch goalUsers after updates
        const updatedGoalUsers = await GoalUser.find({ goalId: goalId });

        // Map the goal to the desired response structure
        const goalData = {
            startDate: goal.startDate,
            endDate: goal.endDate,
            reward: goal.reward,
            bonus: goal.bonus,
            repeat: goal.repeat,
            users: updatedGoalUsers.map(goalUser => ({
                userId: goalUser.userId,
                goalId: goalUser.goalId,
                goalNumber: goalUser.goalNumber
            }))
        };

        res.status(200).json({ message: "Goal updated successfully", goalData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// End a goal by ID
exports.endGoalById = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        const goalId = req.params._id;

        // Only Super Admins, Admins, and the user themselves can view user details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this user" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(goalId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const existingGoal = await Goal.findById(goalId);

        if (!existingGoal || existingGoal.status === false) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        // Update the goal's status to false
        existingGoal.status = false;

        // Save the updated goal
        await existingGoal.save();

        res.status(200).json({ message: "goal End successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Route to get goal stats By Super Admin and Admin
exports.getStats = async (req, res) => {
    try {
        const adminRole = req.user.user.role;
        const goalId = req.params._id;

        // Check user permission
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this user" });
        }

        // Fetch the goal document with populated goalUsers
        const goal = await Goal.findById(goalId).populate('goalUsers');
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const bonus = goal.bonus;
        const goalUsers = goal.goalUsers;

        // Calculate totalTarget by summing the 'goalNumber' property for all users
        const totalTarget = goalUsers.reduce((sum, user) => sum + user.goalNumber, 0);

        // Initialize an array to store user goal completion percentages
        const userGoalPercentage = [];

        // Iterate through each GoalUser record
        for (const user of goalUsers) {
            const total = user.goalNumber;
            const userAchievedTargets = await GoalUserTargets.countDocuments({
                goalId,
                userId: user.userId,
            });

            let bp = 0;
            let cp = userAchievedTargets >= total ? total : userAchievedTargets;

            // Check if the user has achieved all targets
            if (userAchievedTargets >= total) {
                // Calculate bonus percentage for the user
                bp = bonus > 0 ? Math.min((userAchievedTargets - total) * 100 / bonus, 100) : 0;

            }

            userGoalPercentage.push({
                userId: user.userId,
                completed: cp,
                bonus: bp,
            });
        }

        // Calculate total completed and bonus percentages
        const cp = userGoalPercentage.reduce((sum, item) => sum + item.completed, 0);
        const bp = userGoalPercentage.reduce((sum, item) => sum + item.bonus, 0);

        // Calculate average bonus percentage and overall completed percentage
        const avgBp = goalUsers.length > 0 ? bp / goalUsers.length : 0;
        const completedPercentage = goalUsers.length > 0 ? Math.min((cp * 100) / totalTarget, 100) : 0;

        // Calculate incomplete percentage based on completed percentage
        const incompletePercentage = 100 - completedPercentage;

        // Format and send the result as JSON
        res.json({
            completed_percentage: parseFloat(completedPercentage.toFixed(2)),
            incompleted_percentage: parseFloat(incompletePercentage.toFixed(2)),
            bonus_percentage: parseFloat(avgBp.toFixed(2)),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};