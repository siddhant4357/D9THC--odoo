import nodemailer from 'nodemailer';

/**
 * Create email transporter
 * Configure with your email service credentials
 */
const createTransporter = () => {
  // For development, using ethereal email (fake SMTP service)
  // In production, replace with actual SMTP credentials
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development/Testing configuration (using Gmail as example)
    // For Gmail, you need to enable "Less secure app access" or use App Password
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password',
      },
    });
  }
};

/**
 * Send password to user via email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} password - Generated password
 * @param {boolean} isNewUser - Whether this is a new user or password reset
 */
export const sendPasswordEmail = async (email, name, password, isNewUser = true) => {
  try {
    const transporter = createTransporter();

    const subject = isNewUser ? 'Welcome! Your Login Credentials' : 'Your Password Has Been Reset';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .credentials-box {
              background: white;
              border: 2px solid #7c3aed;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .password {
              font-size: 24px;
              font-weight: bold;
              color: #7c3aed;
              letter-spacing: 2px;
              padding: 15px;
              background: #f3e8ff;
              border-radius: 6px;
              margin: 10px 0;
              word-break: break-all;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
              color: #ffffff !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 10px 10px;
              font-size: 12px;
              color: #6b7280;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 ${isNewUser ? 'Welcome to Expense Manager!' : 'Password Reset'}</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${name}!</h2>
            
            ${isNewUser ? `
              <p>Your account has been successfully created. You can now access the Expense Management System with the credentials below.</p>
            ` : `
              <p>Your password has been reset. You can now log in with your new password below.</p>
            `}
            
            <div class="credentials-box">
              <h3>Your Login Credentials</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong></p>
              <div class="password">${password}</div>
            </div>
            
            <div style="text-align: center;">
              <a href="http://localhost:5173/signin" class="button" style="display: inline-block; background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                <span style="color: #ffffff !important;">🔐 Log In Now</span>
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please change your password after your first login</li>
                <li>Never share your password with anyone</li>
                <li>This is an auto-generated password for security</li>
              </ul>
            </div>
            
            <h3>Getting Started:</h3>
            <ol>
              <li>Click the "Log In Now" button above</li>
              <li>Enter your email and the password provided</li>
              <li>Navigate to your account settings to change your password</li>
              <li>Start managing your expenses!</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>This email was sent by Expense Manager System</p>
            <p>If you did not request this account, please contact your administrator immediately.</p>
            <p>&copy; ${new Date().getFullYear()} Expense Manager. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Expense Manager" <${process.env.EMAIL_USER || 'noreply@expensemanager.com'}>`,
      to: email,
      subject: subject,
      html: htmlContent,
      text: `
Hello ${name}!

${isNewUser ? 'Your account has been created.' : 'Your password has been reset.'}

Your Login Credentials:
Email: ${email}
Password: ${password}

Please log in at: http://localhost:5173/signin

Important: Change your password after your first login for security.

Best regards,
Expense Manager Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // If email fails, still return the password so it can be shown to admin
    return { 
      success: false, 
      error: error.message,
      password: password // Include password in response for fallback
    };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

