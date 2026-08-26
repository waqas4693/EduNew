import Unit from '../models/unit.js'
import UnitStats from '../models/unitStats.js'
import CourseStats from '../models/courseStats.js'
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

      // Create UnitStats for the new unit
      const unitStats = new UnitStats({
        unitId: savedUnit._id,
        totalSections: 0
      })
      await unitStats.save()

      // Update CourseStats
      await CourseStats.findOneAndUpdate(
        { courseId: req.body.courseId },
        { $inc: { totalUnits: 1 } }
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

        // Create UnitStats for each new unit
        const unitStats = new UnitStats({
          unitId: savedUnit._id,
          totalSections: 0
        })
        await unitStats.save()
        
        return savedUnit
      })
    )

    // Update CourseStats with bulk increment
    await CourseStats.findOneAndUpdate(
      { courseId },
      { $inc: { totalUnits: units.length } }
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
  console.log('Starting insertUnit with request body:', JSON.stringify(req.body, null, 2));
  
  const session = await Unit.startSession();
  session.startTransaction();
  console.log('MongoDB session started');

  try {
    const { newUnit } = req.body;
    console.log('Processing newUnit:', JSON.stringify(newUnit, null, 2));
    
    // Validate inputs
    if (!newUnit || !newUnit.courseId || !newUnit.number || !newUnit.name) {
      console.log('Validation failed - missing required fields');
      throw new Error('Missing required fields');
    }

    // First, check if a unit with the target number exists
    const existingUnit = await Unit.findOne({
      courseId: newUnit.courseId,
      number: newUnit.number,
      status: 1
    }).session(session);
    
    console.log('Existing unit check result:', existingUnit ? 'Found' : 'Not found');

    if (existingUnit) {
      console.log('Incrementing numbers for units >=', newUnit.number);
      
      // First, find all units that need to be updated
      const unitsToUpdate = await Unit.find({
        courseId: newUnit.courseId,
        number: { $gte: newUnit.number },
        status: 1
      }).sort({ number: -1 }).session(session);
      
      console.log('Found units to update:', unitsToUpdate.length);

      // Update units one by one in descending order to avoid conflicts
      for (const unit of unitsToUpdate) {
        console.log(`Updating unit ${unit._id} from number ${unit.number} to ${unit.number + 1}`);
        await Unit.findByIdAndUpdate(
          unit._id,
          { $inc: { number: 1 } },
          { session }
        );
      }
    }

    console.log('Creating new unit with data:', {
      name: newUnit.name,
      number: newUnit.number,
      courseId: newUnit.courseId
    });

    // Create the new unit
    const unit = new Unit({
      name: newUnit.name,
      number: newUnit.number,
      courseId: newUnit.courseId
    });
    
    try {
      await unit.save({ session });
      console.log('New unit saved successfully:', unit);
    } catch (saveError) {
      console.error('Error saving new unit:', saveError);
      throw saveError;
    }

    console.log('Updating course with new unit ID:', unit._id);
    // Update the course to include the new unit
    const courseUpdate = await Course.findByIdAndUpdate(
      newUnit.courseId,
      { $push: { units: unit._id } },
      { session }
    );
    console.log('Course update result:', courseUpdate ? 'Success' : 'Failed');

    await session.commitTransaction();
    session.endSession();
    console.log('Transaction committed successfully');

    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error in insertUnit:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    await session.abortTransaction();
    session.endSession();
    console.log('Transaction aborted and session ended');
    
    if (error.code === 11000) {
      console.log('Handling duplicate key error');
      try {
        console.log('Attempting to find next available number');
        const nextNumber = await Unit.findOne({
          courseId: newUnit.courseId,
          status: 1
        })
        .sort('-number')
        .select('number')
        .lean();

        const availableNumber = (nextNumber?.number || 0) + 1;
        console.log('Next available number:', availableNumber);

        // Create new unit with the next available number
        const unit = new Unit({
          ...newUnit,
          number: availableNumber
        });
        await unit.save();
        console.log('Unit saved with next available number:', unit);

        return res.status(201).json({
          success: true,
          data: unit
        });
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError);
        return res.status(400).json({
          success: false,
          message: 'Failed to insert unit. Please try again.'
        });
      }
    }
    handleError(res, error);
  }
}; 