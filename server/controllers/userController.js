import User from '../models/user.js'
import Student from '../models/student.js'

const ROLE_LABELS = {
  1: 'Admin',
  2: 'Student',
  3: 'Assessor',
  4: 'Moderator',
  5: 'Verifier'
}

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
      role,
      status: 1,
      emailVerified: true
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

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id name email role status')
      .sort({ role: 1, email: 1 })
      .lean()

    const studentEmails = users
      .filter((user) => user.role === 2)
      .map((user) => user.email)

    const students = studentEmails.length
      ? await Student.find({ email: { $in: studentEmails } })
          .select('name email')
          .lean()
      : []

    const studentNameByEmail = Object.fromEntries(
      students.map((student) => [student.email, student.name])
    )

    res.status(200).json({
      success: true,
      data: users.map((user) => ({
        _id: user._id,
        email: user.email,
        role: user.role,
        roleLabel: ROLE_LABELS[user.role] || 'Unknown',
        status: user.status,
        name: user.name || studentNameByEmail[user.email] || user.email
      }))
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    })
  }
}

export const adminUpdatePassword = async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    user.password = newPassword
    user.emailVerified = true
    await user.save()

    res.status(200).json({
      success: true,
      message: `Password updated for ${user.email}`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
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