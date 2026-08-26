import mongoose from 'mongoose'

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  isUsed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// Index for automatic cleanup of expired tokens
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Index for efficient token lookups
passwordResetSchema.index({ token: 1, isUsed: 1 })

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema)
export default PasswordReset 