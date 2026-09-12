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
  isSectionFullyCompleted,
} from "../utils/sectionCompletion.js";
import {
  buildStudentCourseStatus,
  syncStudentCourseUnlock,
  repairStudentCourseUnlock,
  repairAllStudentCourseUnlocks,
} from "../utils/unlockSync.js";
import {
  assertSectionCanOpen,
  buildSectionsUnlockView,
  buildUnitsUnlockView,
  isSameOrImmediateNext,
} from "../utils/unlockAccess.js";

export const getUnitsUnlockView = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const view = await buildUnitsUnlockView(studentId, courseId);

    res.status(200).json({
      success: true,
      ...view,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    handleError(res, error);
  }
};

export const getSectionsUnlockView = async (req, res) => {
  try {
    const { studentId, courseId, unitId } = req.params;
    const view = await buildSectionsUnlockView(studentId, courseId, unitId);

    res.status(200).json({
      success: true,
      ...view,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    handleError(res, error);
  }
};

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

    try {
      await assertSectionCanOpen({ studentId, courseId, unitId, sectionId });
    } catch (accessError) {
      if (accessError.statusCode) {
        return res.status(accessError.statusCode).json({
          success: false,
          message: accessError.message,
        });
      }
      throw accessError;
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

    let unlockStatus = await CourseUnlock.findOne({ studentId, courseId });

    // Advance only to the same section (idempotent) or the immediate next — never jump gaps
    const shouldAdvanceSection = await isSameOrImmediateNext(
      courseId,
      sectionId,
      unlockStatus?.unlockedSection || null
    );

    if (isLastSection && shouldAdvanceSection) {
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

    const updateData = {
      lastUpdated: Date.now(),
    };

    if (shouldAdvanceSection) {
      updateData.unlockedSection = sectionId;
    }

    if (isLastSection && shouldAdvanceSection) {
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
        unlockedSection: updateData.unlockedSection || (shouldAdvanceSection ? sectionId : undefined),
        ...(updateData.unlockedUnit ? { unlockedUnit: updateData.unlockedUnit } : {}),
        lastUpdated: updateData.lastUpdated,
      });
    } else if (shouldAdvanceSection || updateData.unlockedUnit) {
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
