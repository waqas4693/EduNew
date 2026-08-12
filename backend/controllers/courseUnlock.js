import Section from "../models/section.js";
import Unit from "../models/unit.js";
import UnitStats from "../models/unitStats.js";
import CourseStats from "../models/courseStats.js";
import CourseUnlock from "../models/courseUnlock.js";
import ProgressStats from "../models/progressStats.js";
import CompletedUnits from "../models/completedUnits.js";
import CompletedSections from "../models/completedSections.js";

import { handleError } from "../utils/errorHandler.js";
import { calculateAndUpdateUnitProgress, recalculateAllUnitProgress } from "../utils/unitProgressCalculator.js";
import {
  getSectionPosition,
  isAtOrBeyond,
  isSectionFullyCompleted,
} from "../utils/sectionCompletion.js";
import {
  buildStudentCourseStatus,
  syncStudentCourseUnlock,
  repairStudentCourseUnlock,
  repairAllStudentCourseUnlocks,
} from "../utils/unlockSync.js";

export const getUnlockedUnitAndSection = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    let unlockStatus = await CourseUnlock.findOne({
      studentId,
      courseId,
    });

    let watermark = null;
    if (unlockStatus?.unlockedSection) {
      const position = await getSectionPosition(unlockStatus.unlockedSection);
      if (position) {
        watermark = {
          unitId: position.unitId,
          unitNumber: position.unitNumber,
          sectionId: position.sectionId,
          sectionNumber: position.sectionNumber,
        };
      }
    }

    let unlockedUnitNumber = null;
    if (unlockStatus?.unlockedUnit) {
      const unitDoc = await Unit.findById(unlockStatus.unlockedUnit).select("number");
      unlockedUnitNumber = unitDoc?.number ?? null;
    }

    res.status(200).json({
      success: true,
      unlockedUnit: unlockStatus?.unlockedUnit || null,
      unlockedSection: unlockStatus?.unlockedSection || null,
      unlockedUnitNumber,
      watermark,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const setUnlockedUnitAndSection = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.body;

    if (!studentId || !courseId || !unitId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "studentId, courseId, unitId, and sectionId are required",
      });
    }

    const completedPosition = await getSectionPosition(sectionId);
    if (!completedPosition) {
      return res.status(404).json({
        success: false,
        message: "Section not found or inactive",
      });
    }

    if (String(completedPosition.unitId) !== String(unitId)) {
      return res.status(400).json({
        success: false,
        message: "Section does not belong to the provided unit",
      });
    }

    if (String(completedPosition.courseId) !== String(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Section does not belong to the provided course",
      });
    }

    const sectionComplete = await isSectionFullyCompleted({
      studentId,
      courseId,
      unitId,
      sectionId,
    });

    if (!sectionComplete) {
      return res.status(400).json({
        success: false,
        message: "Section is not fully completed yet",
      });
    }

    // Always record section completion (idempotent)
    try {
      await CompletedSections.create({ studentId, courseId, unitId, sectionId });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }

    try {
      await calculateAndUpdateUnitProgress(studentId, courseId, unitId);
    } catch (error) {
      console.error("Error updating unit progress after section completion:", error);
    }

    // Server-side last-section check (do not trust the client)
    const lastSection = await Section.findOne({
      unitId,
      status: 1,
    })
      .sort({ number: -1 })
      .limit(1);

    const isLastSection =
      lastSection && String(lastSection._id) === String(sectionId);

    if (isLastSection) {
      try {
        await CompletedUnits.findOneAndUpdate(
          { studentId, courseId, unitId },
          { status: 1 },
          { upsert: true, new: true }
        );

        try {
          await calculateAndUpdateUnitProgress(studentId, courseId, unitId);
        } catch (error) {
          console.error("Error updating unit progress after unit completion:", error);
        }
      } catch (error) {
        console.error("Error marking unit as completed:", error);
      }
    }

    let unlockStatus = await CourseUnlock.findOne({ studentId, courseId });
    const currentPosition = unlockStatus?.unlockedSection
      ? await getSectionPosition(unlockStatus.unlockedSection)
      : null;

    // Monotonic watermark: never move unlock pointer backward
    const shouldAdvanceSection = isAtOrBeyond(completedPosition, currentPosition);

    const updateData = {
      lastUpdated: Date.now(),
    };

    if (shouldAdvanceSection) {
      updateData.unlockedSection = sectionId;
    }

    if (isLastSection) {
      const currentUnit = await Unit.findById(unitId).select("number");
      let currentUnlockedUnitNumber = null;

      if (unlockStatus?.unlockedUnit) {
        const unlockedUnitDoc = await Unit.findById(unlockStatus.unlockedUnit).select("number");
        currentUnlockedUnitNumber = unlockedUnitDoc?.number ?? null;
      }

      if (
        currentUnlockedUnitNumber === null ||
        (currentUnit && currentUnit.number >= currentUnlockedUnitNumber)
      ) {
        updateData.unlockedUnit = unitId;
      }
    }

    if (!unlockStatus) {
      unlockStatus = await CourseUnlock.create({
        studentId,
        courseId,
        unlockedSection: updateData.unlockedSection || sectionId,
        ...(updateData.unlockedUnit ? { unlockedUnit: updateData.unlockedUnit } : {}),
        lastUpdated: updateData.lastUpdated,
      });
    } else if (Object.keys(updateData).length > 1 || shouldAdvanceSection || isLastSection) {
      unlockStatus = await CourseUnlock.findOneAndUpdate(
        { studentId, courseId },
        updateData,
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      unlockedUnit: unlockStatus.unlockedUnit,
      unlockedSection: unlockStatus.unlockedSection,
      advanced: shouldAdvanceSection,
      isLastSection: Boolean(isLastSection),
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
      completedUnits: completedUnits.map((cu) => cu.unitId.toString()),
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getCompletedSections = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const completedSections = await CompletedSections.find({
      studentId,
      courseId,
      status: 1,
    });

    res.status(200).json({
      success: true,
      completedSections: completedSections.map((row) => ({
        sectionId: row.sectionId.toString(),
        unitId: row.unitId.toString(),
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getStudentCourseUnlockStatus = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const status = await buildStudentCourseStatus(studentId, courseId);

    res.status(200).json({
      success: true,
      status,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const syncCourseUnlockFromProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const syncResult = await syncStudentCourseUnlock(studentId, courseId);
    const status = await buildStudentCourseStatus(studentId, courseId);

    res.status(200).json({
      success: true,
      syncResult,
      status,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const repairCourseUnlockFromProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const repairResult = await repairStudentCourseUnlock(studentId, courseId);
    const status = await buildStudentCourseStatus(studentId, courseId);

    res.status(200).json({
      success: true,
      repairResult,
      status,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const repairAllCourseUnlocks = async (req, res) => {
  try {
    const summary = await repairAllStudentCourseUnlocks();

    res.status(200).json({
      success: true,
      summary: {
        studentCount: summary.studentCount,
        processed: summary.processed,
        failed: summary.failed,
      },
      // Keep payload smaller in UI; full details still useful for logs
      results: summary.results.map((row) => ({
        studentId: row.studentId,
        studentName: row.studentName,
        courseId: row.courseId,
        success: row.success,
        error: row.error || null,
        unlockedSection: row.syncResult?.unlockedSection || null,
        unlockedUnit: row.syncResult?.unlockedUnit || null,
        healedMcqFlags: row.healResult?.healedMcqFlags || 0,
      })),
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
      console.error("Error recalculating unit progress:", error);
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
      success: true,
    });
  } catch (error) {
    handleError(res, error);
  }
};
