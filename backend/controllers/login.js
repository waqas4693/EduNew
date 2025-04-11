export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: 'Account is inactive' })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    let userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDemo: user.isDemo
    }

    if (user.role === 2) { // Student
      const student = await Student.findOne({ email })
      if (student) {
        userData = {
          ...userData,
          courseIds: student.courses.map(course => ({
            courseId: course.courseId,
            enrollmentDate: course.enrollmentDate
          }))
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        token,
        user: userData
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}
