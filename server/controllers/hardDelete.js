import User from '../models/user.js'
import { HARD_DELETE_CONSENT } from '../constants/hardDelete.js'
import {
  hardDeleteAssessment,
  hardDeleteCourse,
  hardDeleteResource,
  hardDeleteSection,
  hardDeleteUnit
} from '../services/hardDeleteService.js'
import { handleError } from '../utils/errorHandler.js'

const verifyHardDeleteAuth = async (req) => {
  const { password, confirmationText } = req.body || {}

  if (!password || typeof password !== 'string') {
    const error = new Error('Account password is required')
    error.statusCode = 400
    throw error
  }

  if (confirmationText !== HARD_DELETE_CONSENT) {
    const error = new Error(
      'Confirmation text does not match. Type the consent message exactly as shown.'
    )
    error.statusCode = 400
    throw error
  }

  const user = await User.findById(req.user.id)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const isValidPassword = await user.comparePassword(password)
  if (!isValidPassword) {
    const error = new Error('Incorrect account password')
    error.statusCode = 403
    throw error
  }
}

const runHardDelete = async (req, res, deleteFn, successMessage) => {
  try {
    await verifyHardDeleteAuth(req)
    await deleteFn(req.params.id)

    res.status(200).json({
      success: true,
      message: successMessage
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      })
    }

    handleError(res, error)
  }
}

export const hardDeleteCourseHandler = (req, res) =>
  runHardDelete(req, res, hardDeleteCourse, 'Course and all related data permanently deleted')

export const hardDeleteUnitHandler = (req, res) =>
  runHardDelete(req, res, hardDeleteUnit, 'Unit and all related data permanently deleted')

export const hardDeleteSectionHandler = (req, res) =>
  runHardDelete(req, res, hardDeleteSection, 'Section and all related data permanently deleted')

export const hardDeleteResourceHandler = (req, res) =>
  runHardDelete(req, res, hardDeleteResource, 'Resource permanently deleted')

export const hardDeleteAssessmentHandler = (req, res) =>
  runHardDelete(req, res, hardDeleteAssessment, 'Assessment and related attempts permanently deleted')
