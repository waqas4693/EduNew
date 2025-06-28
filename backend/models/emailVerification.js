import mongoose from 'mongoose'

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// Index for automatic cleanup of expired tokens
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema)
export default EmailVerification 