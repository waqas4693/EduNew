import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: Number,
      enum: [1, 2, 3, 4, 5], // 1: Admin, 2: Student, 3: Assessor, 4: Moderator, 5: Verifier
      required: true
    },
    status: {
      type: Number,
      enum: [1, 2],
      default: 1
    }
  },
  { timestamps: false }
)

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    console.log({
      candidatePassword,
      hashedPassword: this.password,
      isMatch
    })
    return isMatch
  } catch (error) {
    throw error
  }
}

const User = mongoose.model('User', userSchema)
export default User
