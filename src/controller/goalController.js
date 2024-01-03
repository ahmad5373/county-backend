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
        const activeGoal = await findActiveGoals();
        const upComingGoal = await findUpcomingGoals();

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

// Get All Ended Goals 
exports.getAllEndedGoals = async (req, res) => {
    try {
        const adminRole = req.user.user.role;
        // Only Super Admins and Admins can get all Goal
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }
        const goals = await Goal.find({
            $or: [
                { status: false },
                { endDate: { $lt: new Date() } }
            ]
        }).populate('goalUsers');

        if (!goals || goals.length === 0) {
            return res.status(404).json({ error: "No Goals Found." });
        }

        const goalsData = await Promise.all(goals.map(async (goal) => {
            const goalStates = await calculateGoalStates(goal.goalUsers); // call function to calculate goals states
            return {
                _id: goal._id,
                startDate: goal.startDate,
                endDate: goal.endDate,
                reward: goal.reward,
                bonus: goal.bonus,
                repeat: goal.repeat,
                goalStates: goalStates,
            };
        }));

        res.status(200).json(goalsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get Active Goals
exports.getActiveGoals = async (req, res) => {
    try {
        const adminRole = req.user.user.role;
        // Check user permissions
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view goals" });
        }
        // Find active goals
        const activeGoals = await findActiveGoals();
        if (!activeGoals) {
            return res.status(404).json({ error: "No Active Goals Found." });
        }

        // Calculate goal states
        const goalStates = await calculateGoalStates(activeGoals.goalUsers);

        // Fetch additional user information
        const users = await Promise.all(activeGoals.goalUsers.map(async goalUser => {
            const user = await User.findById(goalUser.userId);
            const lastUpdatedInfo = await findLastUpdatedInfo(goalUser.userId);
            const lastUpdated = lastUpdatedInfo.length > 0 ? lastUpdatedInfo[0].latestUpdate.updatedAt : null;

            // Calculate user states
            const userStates = await calculateUserStates(goalUser);

            return {
                _id: goalUser._id,
                userId: goalUser.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                goalNumber: goalUser.goalNumber,
                createdAt: goalUser.createdAt,
                updatedAt: goalUser.updatedAt,
                lastUpdated,
                userStates: userStates
            };
        }));

        // Prepare response data
        const activeGoalsData = {
            _id: activeGoals._id,
            startDate: activeGoals.startDate,
            endDate: activeGoals.endDate,
            reward: activeGoals.reward,
            bonus: activeGoals.bonus,
            repeat: activeGoals.repeat,
            createdAt: activeGoals.createdAt,
            updatedAt: activeGoals.updatedAt,
            goalStates: goalStates,
            users: users,
        };

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

        // Find upcoming goals
        const upcomingGoals = await findUpcomingGoals();
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

//Get goal details recruits and states with goalId and userId
exports.getRecruiterDetails = async (req, res) => {
    try {
        const adminRole = req.user.user.role;

        // Only Super Admins and Admins can get all Goal
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create Goal" });
        }

        const userId = req.params.userId;
        const goalId = req.params.goalId;
        if (!validateObjectId(userId, res)) return;
        if (!validateObjectId(goalId, res)) return;

        // Validate if goalId and userId are provided
        if (!goalId || !userId) {
            return res.status(400).json({ error: 'Both goalId and userId are required parameters.' });
        }

        const user = await User.findById(userId);
        const goal = await Goal.findById(goalId).populate('goalUsers');

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found.' });
        }

        const goalUser = await GoalUser.findOne({ userId: userId, goalId: goalId })
        const userStates = await calculateUserStates(goalUser)
        const recruits = await GoalUserTargets.find({ goalId, userId });

        const responseData = {
            _id: goal._id,
            startDate: goal.startDate,
            endDate: goal.endDate,
            reward: goal.reward,
            bonus: goal.bonus,
            repeat: goal.repeat,
            status: goal.status,
            userName: `${user.firstName} ${user.lastName}`,
            goalNumber: goalUser.goalNumber,
            userStates: userStates,
            recruits: recruits.map(recruit => ({
                _id: recruit._id,
                recruiterName: recruit.recruit_name,
                recruiterAt: recruit.recruited_at
            })),
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get active goals with user Id
exports.getActiveGoalsById = async (req, res) => {
    try {
        const adminRole = req.user.user;
        const userId = req.params._id;
        if (!validateObjectId(userId, res)) return;

        // Only Super Admins and Admins can access this information
        if (adminRole.role !== 1 && adminRole.role !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to access this data" });
        }
        // Find all goals for the user
        const userAllGoals = await GoalUser.find({ userId }).lean();

        if (!userAllGoals || userAllGoals.length === 0) {
            return res.status(404).json({ error: 'No goals found for the user' });
        }

        // Find the first active goal among the user's goals
        const userGoals = await Promise.all(userAllGoals.map(async (goalUser) => {
            const activeGoal = await Goal.findOne({
                _id: goalUser.goalId,
                status: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
            }).populate('goalUsers').lean();

            if (!activeGoal) {
                return null;
            }

            return {
                _id: activeGoal._id,
                startDate: activeGoal.startDate,
                endDate: activeGoal.endDate,
                reward: activeGoal.reward,
                bonus: activeGoal.bonus,
                repeat: activeGoal.repeat,
                createdAt: activeGoal.createdAt,
                updatedAt: activeGoal.updatedAt,
                users: await Promise.all(activeGoal.goalUsers.map(async goalUser => {
                    const user = await User.findById(goalUser.userId);
                    const lastUpdatedInfo = await findLastUpdatedInfo(goalUser.userId);
                    const lastUpdated = lastUpdatedInfo.length > 0 ? lastUpdatedInfo[0].latestUpdate.updatedAt : null;

                    // Calculate user states
                    const userStates = await calculateUserStates(goalUser);

                    return {
                        _id: goalUser._id,
                        userId: goalUser.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        goalNumber: goalUser.goalNumber,
                        createdAt: goalUser.createdAt,
                        updatedAt: goalUser.updatedAt,
                        lastUpdated,
                        userStates: userStates
                    };
                })),
            };
        }));

        // Filter out null entries from the map (goals with no data)
        const filteredUserGoals = userGoals.filter(goal => goal !== null);
        // If there's only one active goal, return it directly, otherwise return Error
        const response = filteredUserGoals.length === 1 ? filteredUserGoals[0] : { error: 'No active goal found' };
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get ended goals with goal Id
exports.getEndedGoalsById = async (req, res) => {
    try {
        const adminRole = req.user.user;
        const goalId = req.params._id;
        if (!validateObjectId(goalId, res)) return;

        // Only Super Admins and Admins can access this information
        if (adminRole.role !== 1 && adminRole.role !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to access this data" });
        }

        const endedGoal = await Goal.findOne({
            $or: [
                { _id: goalId, status: false },
                { _id: goalId, endDate: { $lt: new Date() } }
            ]
        }).populate('goalUsers');

        if (!endedGoal) {
            return res.status(404).json({ error: 'No Ended goal found' })
        }

        // Fetch the goal document with populated goalUsers
        const goal = await Goal.findById(goalId).populate('goalUsers');
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goalStates = await calculateGoalStates(goal.goalUsers); // call function to calculate goals states
        const response = {
            _id: endedGoal._id,
            startDate: endedGoal.startDate,
            endDate: endedGoal.endDate,
            reward: endedGoal.reward,
            bonus: endedGoal.bonus,
            repeat: endedGoal.repeat,
            createdAt: endedGoal.createdAt,
            updatedAt: endedGoal.updatedAt,
            goalStates: goalStates,
            users: await Promise.all(endedGoal.goalUsers.map(async goalUser => {
                const user = await User.findById(goalUser.userId);
                const userStates = await calculateUserStates(goalUser)
                const lastUpdatedInfo = await findLastUpdatedInfo(goalUser.userId);
                const lastUpdated = lastUpdatedInfo.length > 0 ? lastUpdatedInfo[0].latestUpdate.updatedAt : null;

                return {
                    _id: goalUser._id,
                    userId: goalUser.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    goalNumber: goalUser.goalNumber,
                    createdAt: goalUser.createdAt,
                    updatedAt: goalUser.updatedAt,
                    lastUpdated,
                    userStates: userStates
                };
            })),
        };
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get a single goal by goal ID with associated users
exports.getGoalById = async (req, res) => {
    try {
        const goalId = req.params._id;
        const adminRole = req.user.user.role

        // Only Super Admins, Admins, and the user themselves can view goals details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this Goal" });
        }
        if (!validateObjectId(goalId, res)) return;

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

// Update goal by goal ID
exports.updateGoalById = async (req, res) => {
    try {
        const goalId = req.params._id;
        const adminRole = req.user.user.role

        // Only Super Admins, Admins, and the user themselves can view user details
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this user" });
        }

        if (!validateObjectId(goalId, res)) return;


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
        if (!validateObjectId(goalId, res)) return;


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
        if (!validateObjectId(goalId, res)) return;

        // Fetch the goal document with populated goalUsers
        const goal = await Goal.findById(goalId).populate('goalUsers');
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        const goalStates = await calculateGoalStates(goal.goalUsers); // call function to calculate goals states
        res.status(200).json(goalStates)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Function to validate if an ID is a valid ObjectId
const validateObjectId = (id, res) => {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ error: "Invalid _id" });
        return false;
    }
    return true;
};

// Helper function to find active goals
async function findActiveGoals() {
    return await Goal.findOne({ startDate: { $lte: new Date() }, endDate: { $gte: new Date() }, status: true }).populate('goalUsers');
}

// Helper function to find Upcoming goal
async function findUpcomingGoals() {
    return await Goal.findOne({ startDate: { $gt: new Date() }, status: true, }).populate('goalUsers');
}

// Helper function to find last updated information for a user
async function findLastUpdatedInfo(userId) {
    return await GoalUserTargets.aggregate([
        {
            $match: {
                userId: userId
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
}

// Helper function to calculate goal states for all users
async function calculateGoalStates(goalUsers) {
    const userGoalPercentage = [];

    for (const user of goalUsers) {
        const bonus = user.bonus;
        const total = user.goalNumber;
        const userAchievedTargets = await GoalUserTargets.countDocuments({
            goalId: user.goalId,
            userId: user.userId,
        });

        let bp = 0;
        let cp = userAchievedTargets >= total ? total : userAchievedTargets;

        if (userAchievedTargets >= total) {
            bp = bonus > 0 ? Math.min((userAchievedTargets - total) * 100 / bonus, 100) : 0;
        }

        userGoalPercentage.push({
            userId: user.userId,
            completed: cp,
            bonus: bp,
        });
    }

    const cp = userGoalPercentage.reduce((sum, item) => sum + item.completed, 0);
    const bp = userGoalPercentage.reduce((sum, item) => sum + item.bonus, 0);
    const avgBp = goalUsers.length > 0 ? bp / goalUsers.length : 0;
    const totalTarget = goalUsers.reduce((sum, user) => sum + user.goalNumber, 0);
    const completedPercentage = goalUsers.length > 0 ? Math.min((cp * 100) / totalTarget, 100) : 0;
    const incompletePercentage = 100 - completedPercentage;

    return {
        completed_percentage: parseFloat(completedPercentage.toFixed(2)),
        incompleted_percentage: parseFloat(incompletePercentage.toFixed(2)),
        bonus_percentage: parseFloat(avgBp.toFixed(2)),
    };
}

// Helper function to calculate user states for a given user
async function calculateUserStates(goalUser) {
    const bonus = goalUser.bonus;
    const total = goalUser.goalNumber;
    const userAchievedTargets = await GoalUserTargets.countDocuments({
        goalId: goalUser.goalId,
        userId: goalUser.userId,
    });

    let bn = 0;
    let cp = userAchievedTargets >= total ? 100 : (userAchievedTargets * 100) / total;

    if (userAchievedTargets >= total) {
        bn = bonus > 0 ? Math.min((userAchievedTargets - total) * 100 / bonus, 100) : 0;
    }

    return {
        complete_percentage: parseFloat(cp.toFixed(2)),
        bonus_percentage: parseFloat(bn.toFixed(2)),
        incomplete_percentage: parseFloat((100 - cp).toFixed(2))
    };
}