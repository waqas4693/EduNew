import Section from "../models/section.js";
import UnitStats from "../models/unitStats.js";
import CourseStats from "../models/courseStats.js";
import CourseUnlock from "../models/courseUnlock.js";
import ProgressStats from "../models/progressStats.js";
import CompletedUnits from "../models/completedUnits.js";
import CompletedSections from "../models/completedSections.js";

import { handleError } from "../utils/errorHandler.js";
import { calculateAndUpdateUnitProgress, recalculateAllUnitProgress } from "../utils/unitProgressCalculator.js";

export const getUnlockedUnitAndSection = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    let unlockStatus = await CourseUnlock.findOne({
      studentId,
      courseId,
    });

    res.status(200).json({
      success: true,
      unlockedUnit: unlockStatus?.unlockedUnit || null,
      unlockedSection: unlockStatus?.unlockedSection || null,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const setUnlockedUnitAndSection = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId, isLastSection } = req.body;

    console.log("Request Landing");
    console.log("studentId", studentId);
    console.log("courseId", courseId);
    console.log("unitId", unitId);
    console.log("sectionId", sectionId);
    console.log("isLastSection", isLastSection);

    let unlockStatus = await CourseUnlock.findOne({
      studentId,
      courseId,
    });

    if (!unlockStatus) {
      const createData = {
        studentId,
        courseId,
        unlockedSection: sectionId,
      };
      
      // Only set unlockedUnit if this is the last section
      if (isLastSection && unitId) {
        const lastSection = await Section.findOne({
          unitId,
          status: 1
        }).sort({ number: -1 }).limit(1);

        if (lastSection && lastSection._id.toString() === sectionId) {
          createData.unlockedUnit = unitId;
        }
      }
      
      unlockStatus = await CourseUnlock.create(createData);
    } else {
      const updateData = {
        unlockedSection: sectionId,
        lastUpdated: Date.now(),
      };
      
      if (isLastSection && unitId) {
        const lastSection = await Section.findOne({
          unitId,
          status: 1
        }).sort({ number: -1 }).limit(1);

        if (lastSection && lastSection._id.toString() === sectionId) {
          updateData.unlockedUnit = unitId;
        }
      }
      
      unlockStatus = await CourseUnlock.findOneAndUpdate(
        { studentId, courseId },
        updateData,
        { new: true }
      );
    }

    try {
      await CompletedSections.create({ studentId, courseId, unitId, sectionId });
      
      // Update unit progress percentage after section completion
      try {
        await calculateAndUpdateUnitProgress(studentId, courseId, unitId);
      } catch (error) {
        console.error('Error updating unit progress after section completion:', error);
        // Don't throw - section completion is more important
      }
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }

    if (isLastSection && unitId) {
      const lastSection = await Section.findOne({
        unitId,
        status: 1
      }).sort({ number: -1 }).limit(1);

      if (lastSection && lastSection._id.toString() === sectionId) {
        try {
          await CompletedUnits.findOneAndUpdate(
            { studentId, courseId, unitId },
            { status: 1 },
            { upsert: true, new: true }
          );
          console.log(`Unit ${unitId} marked as completed (last section completed)`);
          
          // Update unit progress percentage after unit completion
          // Note: This will be 100% since all sections are completed
          try {
            await calculateAndUpdateUnitProgress(studentId, courseId, unitId);
          } catch (error) {
            console.error('Error updating unit progress after unit completion:', error);
            // Don't throw - unit completion is more important
          }
        } catch (error) {
          console.error('Error marking unit as completed:', error);
        }
      } else {
        console.log(`Frontend indicated last section, but backend verification failed`);
      }
    }

    console.log("Response Landing");
    console.log("unlockedUnit", unlockStatus.unlockedUnit);
    console.log("unlockedSection", unlockStatus.unlockedSection);

    res.status(200).json({
      success: true,
      unlockedUnit: unlockStatus.unlockedUnit,
      unlockedSection: unlockStatus.unlockedSection,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCompletedUnits = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const completedUnits = await CompletedUnits.find({
      studentId,
      courseId,
      status: 1,
    });

    res.status(200).json({
      success: true,
      completedUnits: completedUnits.map(cu => cu.unitId.toString()),
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const recalculateProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    try {
      await recalculateAllUnitProgress(studentId, courseId);
    } catch (error) {
      console.error('Error recalculating unit progress:', error);
    }

    const inactiveCompletedUnits = await CompletedUnits.find({
      studentId,
      courseId,
      status: 0,
    });

    for (const completedUnit of inactiveCompletedUnits) {
      const { unitId } = completedUnit;

      const unitStats = await UnitStats.findOne({ unitId });
      
      const totalSections = unitStats.totalSections;

      const completedSectionsCount = await CompletedSections.countDocuments({
        studentId,
        courseId,
        unitId,
        status: 1,
      });

      if (totalSections === completedSectionsCount && totalSections > 0) {
        await CompletedUnits.findOneAndUpdate(
          { studentId, courseId, unitId },
          { status: 1 },
          { new: true }
        );
      }
    }

    const courseStats = await CourseStats.findOne({ courseId });

    const totalUnits = courseStats.totalUnits;

    const completedUnitsCount = await CompletedUnits.countDocuments({
      studentId,
      courseId,
      status: 1,
    });

    const courseProgressPercentage =
      totalUnits > 0
        ? Math.round((completedUnitsCount / totalUnits) * 100)
        : 0;

    await ProgressStats.findOneAndUpdate(
      { studentId, courseId },
      {
        courseprogress: courseProgressPercentage,
        recalculateProgress: false,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true
    });
  } catch (error) {
    handleError(res, error);
  }
};