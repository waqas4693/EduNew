import ResourceView from '../models/resourceView.js'
import { handleError } from '../utils/errorHandler.js'

// Record a resource view
export const recordResourceView = async (req, res) => {
  try {
    const { studentId, resourceId, courseId, unitId, sectionId } = req.body

    const resourceView = await ResourceView.findOneAndUpdate(
      { studentId, resourceId },
      { 
        studentId,
        resourceId,
        courseId,
        unitId,
        sectionId,
        viewedAt: new Date()
      },
      { upsert: true, new: true }
    )

    res.status(200).json({
      success: true,
      data: resourceView
    })
  } catch (error) {
    handleError(res, error)
  }
}

// Get resource views by student
export const getResourceViewsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params

    const views = await ResourceView.find({ studentId })
      .populate('resourceId')
      .populate('courseId')
      .populate('unitId')
      .populate('sectionId')
      .sort({ viewedAt: -1 })

    res.status(200).json({
      success: true,
      data: views
    })
  } catch (error) {
    handleError(res, error)
  }
}

// Get all resource views with student details
export const getAllResourceViews = async (req, res) => {
  try {
    const views = await ResourceView.find()
      .populate('studentId', 'name email')
      .populate('resourceId', 'name resourceType')
      .populate('courseId', 'name')
      .populate('unitId', 'name')
      .populate('sectionId', 'name')
      .sort({ viewedAt: -1 })

    res.status(200).json({
      success: true,
      data: views
    })
  } catch (error) {
    handleError(res, error)
  }
} 