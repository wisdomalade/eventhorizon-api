const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, verificationUrl) => {
  await transporter.sendMail({
    from: `"EventHorizon" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify Your EventHorizon Account",

    text: `Welcome to EventHorizon!

Please verify your email address by clicking the link below:

${verificationUrl}

This verification link expires in 1 hour.`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to EventHorizon!</h2>

        <p>
          Thank you for registering.
          Please verify your email address by clicking the button below.
        </p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          This verification link will expire in 1 hour.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
};