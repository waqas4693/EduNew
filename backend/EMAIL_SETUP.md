# Email Verification Setup

## Environment Variables Required

Add the following variables to your `.env` file in the backend directory:

```env
# SMTP Configuration for Email Verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@ehouse.org.uk
SMTP_PASSWORD=your_smtp_password_here

# Frontend URL (for email verification links)
FRONTEND_URL=http://localhost:3000
```

## SMTP Configuration

### For Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASSWORD`

### For other SMTP providers:
- Update `SMTP_HOST` and `SMTP_PORT` according to your provider
- Use your email credentials in `SMTP_USER` and `SMTP_PASSWORD`

## Features Implemented

1. **Email Verification on Student Creation**: When a student is invited, a verification email is automatically sent
2. **Verification Token**: 32-character hex token valid for 2 days
3. **Email Templates**: Professional HTML email templates for:
   - Initial verification email with credentials
   - Verification success email
   - Resend verification email
4. **Database Model**: `EmailVerification` model to track verification tokens
5. **API Endpoints**:
   - `GET /api/email-verification/verify/:token` - Verify email with token
   - `POST /api/email-verification/resend/:studentId` - Resend verification email
   - `GET /api/email-verification/unverified` - Get unverified students (for admin)

## How it Works

1. When a student is created via the InviteStudent form:
   - User and Student records are created
   - Email verification token is generated
   - Verification email is sent with login credentials
   - Token expires in 2 days

2. Student clicks the verification link:
   - Token is validated
   - User's `emailVerified` field is set to `true`
   - Success email is sent
   - Student can now login

3. Admin can resend verification emails if needed

## Security Features

- Tokens are cryptographically secure (32 bytes random)
- Automatic token expiration (2 days)
- MongoDB TTL index for automatic cleanup of expired tokens
- Email verification status tracked in User model 