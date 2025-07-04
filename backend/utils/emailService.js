import nodemailer from 'nodemailer'
import crypto from 'crypto'

// Create transporter for SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.ehouse.org.uk',
    port: process.env.SMTP_PORT || 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'no-reply@ehouse.org.uk',
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Send verification email
export const sendVerificationEmail = async (email, name, token, password) => {
  try {
    const transporter = createTransporter()
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@ehouse.org.uk',
      to: email,
      subject: 'Welcome to EduSupplements - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">Welcome to EduSupplements!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hello ${name},<br><br>
              Your account has been created successfully. Please verify your email address to activate your account.
            </p>
            
            <div style="background-color: #007bff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: white; margin: 0;">Your Login Credentials</h3>
              <p style="color: white; margin: 10px 0 0 0;">
                <strong>Email:</strong> ${email}<br>
                <strong>Password:</strong> ${password}
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Click the button below to verify your email address:
            </p>
            
            <a href="${verificationUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This verification link will expire in 2 days.<br>
              If you didn't create this account, please ignore this email.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #007bff;">${verificationUrl}</a>
            </p>
          </div>
        </div>
      `
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Verification email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

// Send verification success email
export const sendVerificationSuccessEmail = async (email, name) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@ehouse.org.uk',
      to: email,
      subject: 'Email Verified Successfully - EduSupplements',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d4edda; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #c3e6cb;">
            <h1 style="color: #155724; margin-bottom: 20px;">✅ Email Verified Successfully!</h1>
            <p style="color: #155724; font-size: 16px; line-height: 1.6;">
              Hello ${name},<br><br>
              Your email address has been verified successfully. Your account is now active and you can start learning!
            </p>
            
            <div style="background-color: #28a745; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: white; margin: 0;">Welcome to EduSupplements!</h3>
              <p style="color: white; margin: 10px 0 0 0;">
                You can now access your courses and start your learning journey.
              </p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Login to Your Account
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Verification success email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending verification success email:', error)
    return false
  }
}

// Send resend verification email
export const sendResendVerificationEmail = async (email, name, token, password) => {
  try {
    const transporter = createTransporter()
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@ehouse.org.uk',
      to: email,
      subject: 'Email Verification Link - EduSupplements',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">Email Verification</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hello ${name},<br><br>
              You requested a new verification link for your EduSupplements account.
            </p>
            
            <div style="background-color: #007bff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: white; margin: 0;">Your Login Credentials</h3>
              <p style="color: white; margin: 10px 0 0 0;">
                <strong>Email:</strong> ${email}<br>
                <strong>Password:</strong> ${password}
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Click the button below to verify your email address:
            </p>
            
            <a href="${verificationUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This verification link will expire in 2 days.<br>
              If you didn't request this verification link, please ignore this email.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #007bff;">${verificationUrl}</a>
            </p>
          </div>
        </div>
      `
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Resend verification email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending resend verification email:', error)
    return false
  }
}

// Send password reset email
export const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter()
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@ehouse.org.uk',
      to: email,
      subject: 'Password Reset Request - EduSupplements',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">Password Reset Request</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hello ${name},<br><br>
              We received a request to reset your password for your EduSupplements account.
            </p>
            
            <div style="background-color: #dc3545; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: white; margin: 0;">⚠️ Security Notice</h3>
              <p style="color: white; margin: 10px 0 0 0;">
                If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Click the button below to reset your password:
            </p>
            
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This reset link will expire in 1 hour.<br>
              For security reasons, this link can only be used once.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #007bff;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (email, name) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'no-reply@ehouse.org.uk',
      to: email,
      subject: 'Password Reset Successful - EduSupplements',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d4edda; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #c3e6cb;">
            <h1 style="color: #155724; margin-bottom: 20px;">✅ Password Reset Successful!</h1>
            <p style="color: #155724; font-size: 16px; line-height: 1.6;">
              Hello ${name},<br><br>
              Your password has been successfully reset. You can now login to your account with your new password.
            </p>
            
            <div style="background-color: #28a745; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: white; margin: 0;">Security Reminder</h3>
              <p style="color: white; margin: 10px 0 0 0;">
                If you didn't perform this password reset, please contact our support team immediately.
              </p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Login to Your Account
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset success email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending password reset success email:', error)
    return false
  }
} 