import nodemailer from 'nodemailer';

// Create a test account if you don't have real email credentials
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };
};

// Send email function
const sendEmail = async (to, subject, text, html) => {
  try {
    // Use environment variables for production or test account for development
    const transportConfig = process.env.EMAIL_HOST
      ? {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
      : await createTestAccount();

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // If using ethereal email for testing, log the preview URL
    if (transportConfig.host === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export default sendEmail;