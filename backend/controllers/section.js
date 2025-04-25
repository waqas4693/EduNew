import Section from '../models/section.js'
import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'
import Unit from '../models/unit.js'

export const createSection = async (req, res) => {
  try {
    const { sections } = req.body
    
    if (!Array.isArray(sections)) {
      // Check if number already exists for this unit
      const existingSection = await Section.findOne({ 
        unitId: req.body.unitId,
        number: req.body.number,
        status: 1
      })

      if (existingSection) {
        return res.status(400).json({
          success: false,
          message: `Section number ${req.body.number} already exists in this unit`
        })
      }

      const section = new Section({
        name: req.body.name,
        number: req.body.number,
        unitId: req.body.unitId,
        resources: [],
        status: 1
      })
      const savedSection = await section.save()
      
      await Unit.findByIdAndUpdate(
        req.body.unitId,
        { $push: { sections: savedSection._id } }
      )

      return res.status(201).json({
        success: true,
        data: savedSection
      })
    }

    // For bulk creation, validate all numbers first
    const unitId = sections[0].unitId
    const numbers = sections.map(section => section.number)
    
    // Check for duplicate numbers within the request
    if (new Set(numbers).size !== numbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate section numbers found in the request'
      })
    }

    // Check if any numbers already exist in the database
    const existingSections = await Section.find({
      unitId,
      number: { $in: numbers },
      status: 1
    })

    if (existingSections.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Section number(s) ${existingSections.map(s => s.number).join(', ')} already exist in this unit`
      })
    }

    const savedSections = await Promise.all(
      sections.map(async sectionData => {
        const section = new Section({
          name: sectionData.name,
          number: sectionData.number,
          unitId: sectionData.unitId,
          resources: [],
          status: 1
        })
        const savedSection = await section.save()
        
        await Unit.findByIdAndUpdate(
          sectionData.unitId,
          { $push: { sections: savedSection._id } }
        )
        
        return savedSection
      })
    )
    
    res.status(201).json({
      success: true,
      data: savedSections
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate section number found'
      })
    }
    handleError(res, error)
  }
}

export const getUnitSections = async (req, res) => {
  try {
    const { unitId } = req.params
    const sections = await Section.find({ 
      unitId,
      status: 1 
    }).sort('number') // Sort by number field
    
    res.status(200).json({
      sections
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const section = await Section.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    )

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      })
    }

    res.status(200).json({
      success: true,
      data: section
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getLatestSectionNumber = async (req, res) => {
  try {
    const { unitId } = req.params

    const latestSection = await Section.findOne({ 
      unitId,
      status: 1 
    })
    .sort('-number')
    .select('number')

    res.status(200).json({
      success: true,
      nextNumber: (latestSection?.number || 0) + 1
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateSectionNumber = async (req, res) => {
  try {
    const { id } = req.params
    const { newNumber, unitId } = req.body

    // Check for number conflicts
    const existingSection = await Section.findOne({
      unitId,
      number: newNumber,
      status: 1,
      _id: { $ne: id }
    })

    if (existingSection) {
      return res.status(400).json({
        success: false,
        message: `Section number ${newNumber} already exists in this unit`
      })
    }

    // Update section number
    const section = await Section.findByIdAndUpdate(
      id,
      { number: newNumber },
      { new: true }
    )

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      })
    }

    res.status(200).json({
      success: true,
      data: section
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const swapSectionNumbers = async (req, res) => {
  try {
    const { sectionId1, sectionId2 } = req.body

    const section1 = await Section.findById(sectionId1)
    const section2 = await Section.findById(sectionId2)

    if (!section1 || !section2) {
      return res.status(404).json({
        success: false,
        message: 'One or both sections not found'
      })
    }

    // Start a session for transaction
    const session = await Section.startSession()
    session.startTransaction()

    try {
      // Temporarily set one section's number to a unique value
      const tempNumber = -1
      await Section.findByIdAndUpdate(
        sectionId1,
        { number: tempNumber },
        { session }
      )

      // Update the second section's number to the first section's original number
      await Section.findByIdAndUpdate(
        sectionId2,
        { number: section1.number },
        { session }
      )

      // Update the first section's number to the second section's original number
      await Section.findByIdAndUpdate(
        sectionId1,
        { number: section2.number },
        { session }
      )

      // Commit the transaction
      await session.commitTransaction()
      session.endSession()

      // Fetch the updated sections
      const updatedSection1 = await Section.findById(sectionId1)
      const updatedSection2 = await Section.findById(sectionId2)

      res.status(200).json({
        success: true,
        data: [updatedSection1, updatedSection2]
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

export const insertSection = async (req, res) => {  
  const session = await Section.startSession();
  session.startTransaction();

  try {
    const { newSection } = req.body;
    
    // Validate inputs
    if (!newSection || !newSection.unitId || !newSection.number || !newSection.name) {
      throw new Error('Missing required fields');
    }

    // First, check if a section with the target number exists
    const existingSection = await Section.findOne({
      unitId: newSection.unitId,
      number: newSection.number,
      status: 1
    }).session(session);
    
    if (existingSection) {
      
      // First, find all sections that need to be updated
      const sectionsToUpdate = await Section.find({
        unitId: newSection.unitId,
        number: { $gte: newSection.number },
        status: 1
      }).sort({ number: -1 }).session(session);
      

      // Update sections one by one in descending order to avoid conflicts
      for (const section of sectionsToUpdate) {
        await Section.findByIdAndUpdate(
          section._id,
          { $inc: { number: 1 } },
          { session }
        );
      }
    }

    // Create the new section
    const section = new Section({
      name: newSection.name,
      number: newSection.number,
      unitId: newSection.unitId
    });
    
    try {
      await section.save({ session });
    } catch (saveError) {
      throw saveError;
    }

    // Update the unit to include the new section
    const unitUpdate = await Unit.findByIdAndUpdate(
      newSection.unitId,
      { $push: { sections: section._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error in insertSection:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    await session.abortTransaction();
    session.endSession();
    
    if (error.code === 11000) {
      try {
        const nextNumber = await Section.findOne({
          unitId: newSection.unitId,
          status: 1
        })
        .sort('-number')
        .select('number')
        .lean();

        const availableNumber = (nextNumber?.number || 0) + 1;

        // Create new section with the next available number
        const section = new Section({
          ...newSection,
          number: availableNumber
        });
        await section.save();

        return res.status(201).json({
          success: true,
          data: section
        });
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError);
        return res.status(400).json({
          success: false,
          message: 'Failed to insert section. Please try again.'
        });
      }
    }
    handleError(res, error);
  }
}; 