import UnitStats from "../models/unitStats.js";
import CourseStats from "../models/courseStats.js";
import CourseUnlock from "../models/courseUnlock.js";
import ProgressStats from "../models/progressStats.js";
import CompletedUnits from "../models/completedUnits.js";
import CompletedSections from "../models/completedSections.js";
import Section from "../models/section.js";

import { handleError } from "../utils/errorHandler.js";

export const getUnlockedUnitAndSection = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    let unlockStatus = await CourseUnlock.findOne({
      studentId,
      courseId,
    });

    res.status(200).json({
      success: true,
      unlockedUnit: unlockStatus.unlockedUnit,
      unlockedSection: unlockStatus.unlockedSection,
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
      unlockStatus = await CourseUnlock.create({
        studentId,
        courseId,
        unlockedUnit: unitId,
        unlockedSection: sectionId,
      });
    } else {
      unlockStatus = await CourseUnlock.findOneAndUpdate(
        { studentId, courseId },
        {
          unlockedUnit: unitId,
          unlockedSection: sectionId,
          lastUpdated: Date.now(),
        },
        { new: true }
      );
    }

    try {
      await CompletedSections.create({ studentId, courseId, unitId, sectionId });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }

    // Check if this is the last section and mark unit as completed
    if (isLastSection && unitId) {
      // Verify on backend that this section is actually the last section
      const lastSection = await Section.findOne({
        unitId,
        status: 1
      }).sort({ number: -1 }).limit(1);

      if (lastSection && lastSection._id.toString() === sectionId) {
        // This is confirmed to be the last section - mark unit as completed
        try {
          await CompletedUnits.findOneAndUpdate(
            { studentId, courseId, unitId },
            { status: 1 },
            { upsert: true, new: true }
          );
          console.log(`✅ Unit ${unitId} marked as completed (last section completed)`);
        } catch (error) {
          console.error('Error marking unit as completed:', error);
          // Don't throw - section completion is more important
        }
      } else {
        console.log(`⚠️ Frontend indicated last section, but backend verification failed`);
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
    const { studentId, courseId } = req.body;

    const completedUnits = await CompletedUnits.find({
      studentId,
      courseId,
      status: 1,
    });

    res.status(200).json({
      success: true,
      completedUnits,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const recalculateProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

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