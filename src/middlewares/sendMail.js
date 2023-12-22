
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

console.log("user email ", USER_EMAIL);
console.log("user password",USER_PASSWORD);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: USER_EMAIL,
        pass: USER_PASSWORD,
    },
});

const sendMail = async(to, subject , html)=>{
    const mailOption ={
        from: USER_EMAIL,
        to,
        subject,
        html,
    };
    try {
        const info = await transporter.sendMail(mailOption);
        console.log("email Sent Info : ", info);
        console.log("email Sent: ", info.messageId);
    } catch (error) {
        console.log("Error Sending email ",error);
    }

};

module.exports = sendMail;