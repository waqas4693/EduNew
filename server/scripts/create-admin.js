import mongoose from 'mongoose'
import User from '../models/user.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/edusupplements')
    console.log('✅ Connected to MongoDB')

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@edu.com' })
    
    if (existingAdmin) {
      console.log('❌ Admin user already exists with email: admin@edu.com')
      console.log('Admin user details:', {
        id: existingAdmin._id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status,
        isDemo: existingAdmin.isDemo,
        emailVerified: existingAdmin.emailVerified
      })
      return
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@edu.com',
      password: '123456', // Will be hashed by the pre-save middleware
      role: 1, // 1: Admin
      status: 1, // 1: Active
      isDemo: false,
      emailVerified: true
    })

    // Save the admin user
    await adminUser.save()
    
    console.log('✅ Admin user created successfully!')
    console.log('Admin user details:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status,
      isDemo: adminUser.isDemo,
      emailVerified: adminUser.emailVerified
    })
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
  } finally {
    // Close the database connection
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the script
createAdminUser()
