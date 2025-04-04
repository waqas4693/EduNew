import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'
import Course from '../models/course.js'

export const createUnit = async (req, res) => {
  try {
    const { units } = req.body
    
    if (!Array.isArray(units)) {
      // Check if number already exists for this course
      const existingUnit = await Unit.findOne({ 
        courseId: req.body.courseId,
        number: req.body.number,
        status: 1
      })

      if (existingUnit) {
        return res.status(400).json({
          success: false,
          message: `Unit number ${req.body.number} already exists in this course`
        })
      }

      const unit = new Unit({ 
        name: req.body.name,
        number: req.body.number,
        courseId: req.body.courseId 
      })
      const savedUnit = await unit.save()
      
      await Course.findByIdAndUpdate(
        req.body.courseId,
        { $push: { units: savedUnit._id } }
      )

      return res.status(201).json({
        success: true,
        data: savedUnit
      })
    }

    // For bulk creation, validate all numbers first
    const courseId = units[0].courseId
    const numbers = units.map(unit => unit.number)
    
    // Check for duplicate numbers within the request
    if (new Set(numbers).size !== numbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate unit numbers found in the request'
      })
    }

    // Check if any numbers already exist in the database
    const existingUnits = await Unit.find({
      courseId,
      number: { $in: numbers },
      status: 1
    })

    if (existingUnits.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unit number(s) ${existingUnits.map(u => u.number).join(', ')} already exist in this course`
      })
    }

    const savedUnits = await Promise.all(
      units.map(async unitData => {
        const unit = new Unit({
          name: unitData.name,
          number: unitData.number,
          courseId: unitData.courseId
        })
        const savedUnit = await unit.save()
        
        await Course.findByIdAndUpdate(
          unitData.courseId,
          { $push: { units: savedUnit._id } }
        )
        
        return savedUnit
      })
    )
    
    res.status(201).json({
      success: true,
      data: savedUnits
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate unit number found'
      })
    }
    handleError(res, error)
  }
}

export const getCourseUnits = async (req, res) => {
  try {
    const { courseId } = req.params
    const units = await Unit.find({ 
      courseId,
      status: 1 
    }).sort('number') // Sort by number field
    
    res.status(200).json({
      units
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const unit = await Unit.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    )

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      })
    }

    res.status(200).json({
      success: true,
      data: unit
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getLatestUnitNumber = async (req, res) => {
  try {
    const { courseId } = req.params

    const latestUnit = await Unit.findOne({ 
      courseId,
      status: 1 
    })
    .sort('-number')
    .select('number')

    res.status(200).json({
      success: true,
      nextNumber: (latestUnit?.number || 0) + 1
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateUnitNumber = async (req, res) => {
  try {
    const { id } = req.params
    const { newNumber, courseId } = req.body

    // Check for number conflicts
    const existingUnit = await Unit.findOne({
      courseId,
      number: newNumber,
      status: 1,
      _id: { $ne: id }
    })

    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: `Unit number ${newNumber} already exists in this course`
      })
    }

    // Update unit number
    const unit = await Unit.findByIdAndUpdate(
      id,
      { number: newNumber },
      { new: true }
    )

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      })
    }

    res.status(200).json({
      success: true,
      data: unit
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const swapUnitNumbers = async (req, res) => {
  try {
    const { unitId1, unitId2 } = req.body

    const unit1 = await Unit.findById(unitId1)
    const unit2 = await Unit.findById(unitId2)

    if (!unit1 || !unit2) {
      return res.status(404).json({
        success: false,
        message: 'One or both units not found'
      })
    }

    // Start a session for transaction
    const session = await Unit.startSession()
    session.startTransaction()

    try {
      // Temporarily set one unit's number to a unique value
      const tempNumber = -1
      await Unit.findByIdAndUpdate(
        unitId1,
        { number: tempNumber },
        { session }
      )

      // Update the second unit's number to the first unit's original number
      await Unit.findByIdAndUpdate(
        unitId2,
        { number: unit1.number },
        { session }
      )

      // Update the first unit's number to the second unit's original number
      await Unit.findByIdAndUpdate(
        unitId1,
        { number: unit2.number },
        { session }
      )

      // Commit the transaction
      await session.commitTransaction()
      session.endSession()

      // Fetch the updated units
      const updatedUnit1 = await Unit.findById(unitId1)
      const updatedUnit2 = await Unit.findById(unitId2)

      res.status(200).json({
        success: true,
        data: [updatedUnit1, updatedUnit2]
      })
    } catch (error) {
      // If any error occurs, abort the transaction
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  } catch (error) {
    handleError(res, error)
  }
}

export const insertUnit = async (req, res) => {
  try {
    const { afterUnitId, newUnit } = req.body

    // If afterUnitId is null, we're inserting at the beginning
    if (!afterUnitId) {
      // Increment numbers of all units first
      await Unit.updateMany(
        {
          courseId: newUnit.courseId,
          status: 1
        },
        { $inc: { number: 1 } }
      )

      // Create new unit with number 1
      const unit = new Unit({
        ...newUnit,
        number: 1
      })
      await unit.save()

      return res.status(201).json({
        success: true,
        data: unit
      })
    }

    const afterUnit = await Unit.findById(afterUnitId)
    if (!afterUnit) {
      return res.status(404).json({
        success: false,
        message: 'Reference unit not found'
      })
    }

    // Increment numbers of all units from the target number onwards first
    await Unit.updateMany(
      {
        courseId: afterUnit.courseId,
        number: { $gte: newUnit.number },
        status: 1
      },
      { $inc: { number: 1 } }
    )

    // Create new unit with the provided number
    const unit = new Unit({
      ...newUnit,
      courseId: afterUnit.courseId
    })
    await unit.save()

    res.status(201).json({
      success: true,
      data: unit
    })
  } catch (error) {
    handleError(res, error)
  }
} 