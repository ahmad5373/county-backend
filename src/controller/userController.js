const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user")
const { default: mongoose } = require("mongoose");
const dotenv = require("dotenv");
const { Goal, GoalUserTargets, GoalUser } = require("../models/goal");
dotenv.config();
const crypto = require("crypto");
const sendMail = require("../middlewares/sendMail");


//User Signup
exports.signup = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 1
        });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error while creating user:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//Creation User By Super Admin & Admin
exports.createUser = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        // Only Super Admins and Admins can create new users
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to create User" });
        }
        const { firstName, lastName, email, password, role, } = req.body;

        // If the logged-in user is an admin (role === 2), they cannot create a super admin (role === 1)
        if (adminRole === 2 && role === 1) {
            return res.status(403).json({ error: "Forbidden: Admins cannot create Super Admins" });
        }
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
        });
        await user.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error while creating user:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//User Login 
exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const payload = {
            user: {
                id: user.id,
                role: user.role
            },
        };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "2h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token, "User": user });
            }
        );
    } catch (error) {
        console.error("Error while logging in:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//Get All Users
exports.getAllUser = async (req, res) => {
    try {
        const adminRole = req.user.user.role
        // Only Super Admins and Admins can get all users
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to View All User" });
        }
        const deletedFalseUsers = await User.find({ deleted: false });
        res.status(200).json(deletedFalseUsers);
    } catch (error) {
        console.error("Error while fetching users:", error.message);
        res.status(500).json({ error: error.message });
    }
};

//Get User With Id
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params._id;
        const adminRole = req.user.user
        // Only Super Admins, Admins, and the user themselves can view user details
        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to view this user" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const user = await User.findById(userId);
        if (!user || user.deleted === true) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log("Error while fetching user:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//Update User With UserId By Admin
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params._id;
        const adminRole = req.user.user

        // Only Super Admins, Admins, and the user themselves can Edit user details
        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to Edit this user" });
        }
        const { firstName, lastName, email, role, status, password, deleted } = req.body;

        // If the logged-in user is an admin (role === 2), they cannot edit a super admin or admin
        if (adminRole === 2 && (user.role === 1 || user.role === 2)) {
            return res.status(403).json({ error: "Forbidden: Admins cannot edit Super Admins or Admins" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const user = await User.findById(userId);
        if (!user || user.deleted === true) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the updated email is already taken by another user
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ error: "Email is already taken" });
            }
            user.email = email
        }

        // bcrypt the password using hash technique if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        // Update other fields if provided
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.role = role || user.role;
        user.status = status || user.status;
        user.deleted = deleted || user.deleted;

        await user.save();
        res.status(200).json({ message: "User updated successfully " });
    } catch (error) {
        console.log("Error while fetching user:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//Update User Password With UserId
exports.changePassword = async (req, res) => {
    try {
        const userId = req.params._id;
        const adminRole = req.user.user
        // Only Super Admins, Admins, and the user themselves can change user password
        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to Change this user Password" });
        }
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const user = await User.findById(userId);
        if (!user || user.deleted === true) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Old password is incorrect" });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "New password and confirm password do not match" });
        }

        // Update the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        // Save the updated user in the database
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.log("Error while updating password:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Update User Password With UserId By Super Admin & Admin Only
exports.resetPassword = async (req, res) => {
    try {
        const userId = req.params._id;
        const adminRole = req.user.user.role
        // Only Super Admins, Admins,  can reset user password
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to reset  user password" });
        }

        const password = "password"
        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const user = await User.findById(userId);
        if (!user || user.deleted === true) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;

        // Save the updated user in the database
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.log("Error while updating password:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//Forget-password 
exports.ForgetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            return res.status(404).json({ error: "User Not Found" })
        }
        //Generate Token for reset and expiration time 
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000 // Token Expire in One hour 
        await user.save();

        // Create a password reset link
        const resetLink = `http://127.0.0.1:5500/resetPassword.html/reset-password?token=${resetToken}`;

        //Compose email 
        const subject = "Password Reset Request";
        const html = `Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a>`;

        await sendMail(user.email, subject, html);

        res.status(200).json({ message: "Password reset link sent to your email " })
    } catch (error) {
        console.error("Error while processing forgot password request:", error.message);
        res.status(500).json({ error: error.message });
    }
}


exports.firstResetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid Or Token Expired" });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "New password and confirm password does not match" });
        }

        //Update Password with new Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        //Clear Reset Token Field 
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.status(200).json({ message: "Password Reset Successfully." });
    } catch (error) {
        console.log("Error While resetting password ", error.message);
        res.status(500).json({ error: error.message });
    }
}


//Update Status With Id  By Super Admin & Admin Only
exports.changeStatus = async (req, res) => {
    try {
        const userId = req.params._id;
        userStatus = req.body.status;

        const adminRole = req.user.user.role
        // Only Super Admins and Admins,  can change user status
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to change  user status" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }
        // return error if status is not found or undefined
        if (userStatus === undefined) {
            return res.status(400).json({ error: "Status is not Provided" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await user.updateOne({ $set: { status: userStatus } });
        res.status(200).json({ message: "User status change successfully" });
    } catch (error) {
        console.error("Error while deleting user:", error.message);
        res.status(500).json({ error: error.message });
    }
};

//Soft Delete User With Id  By Super Admin & Admin Only
exports.softDelete = async (req, res) => {
    try {
        const userId = req.params._id;
        const adminRole = req.user.user.role
        // Only Super Admins and Admins,  can soft delete user 
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to Delete this user" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const user = await User.findById(userId);
        if (!user || user.deleted === true) {
            return res.status(404).json({ error: "User not found" });
        }
        await user.updateOne({ $set: { deleted: true } });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error while deleting user:", error.message);
        res.status(500).json({ error: error.message });
    }
};


//Delete User Permanently With Id  By Super Admin & Admin Only
exports.permanentDelete = async (req, res) => {
    try {
        const userId = req.params._id;
        const adminRole = req.user.user.role
        // Only Super Admins and Admins,  can permanent delete user 
        if (adminRole !== 1 && adminRole !== 2) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to Delete this user" });
        }

        // Validate if the provided ID is a valid ObjectId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid _id" });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error while deleting user:", error.message);
        res.status(500).json({ error: error.message });
    }
};

//Get active Goal on the User Side With Recruits
exports.getActiveGoalWithRecruits = async (req, res) => {
    try {
        const adminRole = req.user.user;
        const userId = req.params._id;

        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to delete this user" });
        }

        const goalUserEntries = await GoalUser.find({ userId }).lean();

        if (!goalUserEntries || goalUserEntries.length === 0) {
            return res.status(404).json({ error: "No goal data found." });
        }

        const userGoals = await Promise.all(goalUserEntries.map(async (goalUser) => {
            const activeGoal = await Goal.findOne({
                _id: goalUser.goalId,
                status: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
            }).lean();
            if (!activeGoal) {
                return null;
            }
            const userRecruits = await GoalUserTargets.find({ goalId: activeGoal._id, userId }).lean();
            return {
                _id: activeGoal._id,
                startDate: activeGoal.startDate,
                endDate: activeGoal.endDate,
                reward: activeGoal.reward,
                bonus: activeGoal.bonus,
                repeat: activeGoal.repeat,
                status: activeGoal.status,
                userRecruits: userRecruits.map(({ _id, recruit_name, recruited_at }) => ({
                    _id,
                    recruiterName: recruit_name,
                    recruiterAt: recruited_at,
                })),
            };
        }));

        // Filter out null entries from the map (goals with no data)
        const filteredUserGoals = userGoals.filter(goal => goal !== null);
        // If there's only one active goal, return it directly, otherwise return the array
        const response = filteredUserGoals.length === 1 ? filteredUserGoals[0] : { error: 'No active goal found' };
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


//Get user states with userId
exports.GetUserStats = async (req, res) => {
    try {
        const adminRole = req.user.user;
        const userId = req.params._id;

        if (adminRole.role !== 1 && adminRole.role !== 2 && adminRole.id !== userId) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to delete this user" });
        }

        const goalUser = await GoalUser.find({ userId }).lean();

        if (!goalUser || goalUser.length === 0) {
            return res.status(404).json({ error: "No goal data found." });
        }

        const userGoals = await Promise.all(goalUser.map(async (user) => {
            const userActiveGoal = await Goal.findOne({
                _id: user.goalId,
                status: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
            }).populate('goalUsers').lean();

            if (!userActiveGoal) {
                return null;
            }

            const goalUserEntry = userActiveGoal.goalUsers.find(u => u.userId.toString() === userId);

            if (!goalUserEntry) {
                return null;
            }

            const { bonus: totalBonus } = userActiveGoal;
            const { goalNumber: total } = goalUserEntry;

            const completed = await GoalUserTargets.countDocuments({ goalId: userActiveGoal._id, userId });
            const remaining = total - completed;
            let bn = 0;
            let cp = 0;

            if (remaining < 0) {
                const extra = completed - total;
                if (totalBonus > 0) {
                    bn = Math.min((extra * 100) / totalBonus, 100);
                }
                cp = 100;
            } else if (total > 0) {
                cp = (completed * 100) / total;
            }

            return {
                goalId: userActiveGoal._id,
                completed_percentage: parseFloat(cp.toFixed(2)),
                incompleted_percentage: parseFloat((100 - cp).toFixed(2)),
                bonus_percentage: parseFloat(bn.toFixed(2)),
            };
        }));

        // Filter out null entries from the map (goals with no data)
        const filteredUserGoals = userGoals.filter(goal => goal !== null);
        // If there's only one active goal, return it directly, otherwise return Error
        const response = filteredUserGoals.length === 1 ? filteredUserGoals[0] : { error: 'No active goal found' };
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};