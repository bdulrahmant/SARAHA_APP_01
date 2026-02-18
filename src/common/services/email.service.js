import nodemailer from "nodemailer"

export const sendEmail = async ({
    to,
    subject,
    html
}) => {

    const transporter = nodemailer.createTransport({

        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }

    })


    const info = await transporter.sendMail({

        from: `"Route App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html

    })


    console.log("Email sent:", info.messageId)

    return info

}
