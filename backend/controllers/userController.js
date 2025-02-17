import User from '../models/user.js'
import bcrypt from 'bcryptjs'

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      })
    }

    // Validate role
    const allowedRoles = [3, 4, 5] // Assessor, Moderator, Verifier
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    })

    await user.save()

    res.status(201).json({
      message: 'User created successfully',
      data: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    })
  }
}

export const getAssessmentUsers = async (req, res) => {
  try {
    // Fetch users by role
    const [assessors, moderators, verifiers] = await Promise.all([
      User.find({ role: 3 }).select('_id name email'),
      User.find({ role: 4 }).select('_id name email'),
      User.find({ role: 5 }).select('_id name email')
    ])

    res.status(200).json({
      success: true,
      data: {
        assessors,
        moderators,
        verifiers
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    })
  }
} 