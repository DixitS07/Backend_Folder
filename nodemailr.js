const nodemailer = require("nodemailer");

const sendEmail = async (email,subject,text)=>{
    try{
        const transporter = nodemailer.createTransport({
            // host: 'smtp.ethereal.email',
            service:'gmail',
            port: 587,
            auth: {
                user: 'connectquizly@gmail.com',
                pass: 'atdqixtqytrtwwpy'
            }
        });
        await transporter.sendMail({
            from:"connectquizly@gmail.com",
            to:email,
            subject:subject,
            text:text
        });
        console.log("email sent successfully");
    }catch(error){
        console.log(error,"email not sent");
    }
}
module.exports = sendEmail;