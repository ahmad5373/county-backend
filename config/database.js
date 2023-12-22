const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectionDB = async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongo DB connected ${conn.connection.host}`);
    } catch (error) {
        console.log("error While connecting to Database",error);
        process.exit();
    }
};
module.exports = connectionDB;