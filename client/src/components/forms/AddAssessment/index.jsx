import {
  Box,
  Typography,
  Backdrop,
  CircularProgress,
  LinearProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  Paper
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import PropTypes from 'prop-types'
import { useEffect, useMemo, useState } from 'react'
import { useAssessmentForm } from './hooks/useAssessmentForm'
import { useHierarchyData } from './hooks/useHierarchyData'
import { useAssessmentAPI } from './hooks/useAssessmentAPI'
import { useMCQManagement } from './hooks/useMCQManagement'
import { useFormValidation } from './hooks/useFormValidation'
import {
  calculateRemainingPercentage,
  shouldShowTimeOptions
} from './utils/assessmentHelpers'
import HardDeleteDialog from '../../common/HardDeleteDialog'

import FormSection from './components/ui/FormSection'
import SuccessMessage from './components/ui/SuccessMessage'
import ErrorMessage from './components/ui/ErrorMessage'
import SubmitButton from './components/ui/SubmitButton'

import CourseSelector from './components/selectors/CourseSelector'
import UnitSelector from './components/selectors/UnitSelector'
import SectionSelector from './components/selectors/SectionSelector'

import AssessmentBasicInfo from './components/forms/AssessmentBasicInfo'
import AssessmentTypeSelector from './components/forms/AssessmentTypeSelector'
import AssessmentMetrics from './components/forms/AssessmentMetrics'
import RoleSelectionForm from './components/forms/RoleSelectionForm'
import TimeOptionsForm from './components/forms/TimeOptionsForm'
import MCQForm from './components/forms/MCQForm'
import QNAForm from './components/forms/QNAForm'
import FileAssessmentForm from './components/forms/FileAssessmentForm'

const AddAssessment = ({ courseId: propsCourseId, editMode, builderMode = false, onNotify }) => {
  const [assessmentsLoaded, setAssessmentsLoaded] = useState(false)
  const [showForm, setShowForm] = useState(!builderMode)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const {
    formData,
    isSubmitting,
    successMessage,
    errorMessage,
    handleFormChange,
    handleContentChange,
    loadFormData,
    resetForm,
    setSubmitting,
    setSuccess,
    setError
  } = useAssessmentForm()

  const {
    courseId,
    unitId,
    sectionId,
    courses,
    units,
    sections,
    existingAssessments,
    remainingPercentage,
    setCourseId,
    setUnitId,
    setSectionId,
    fetchExistingAssessments
  } = useHierarchyData({ manualAssessmentLoad: builderMode })

  const {
    assessors,
    moderators,
    verifiers,
    submitAssessment,
    updateAssessment,
    uploadProgress
  } = useAssessmentAPI()

  const {
    mcqOptionCounts,
    addMCQ,
    removeMCQ,
    handleMCQChange,
    handleMCQOptionChange,
    handleMCQFileChange,
    setTotalOptions
  } = useMCQManagement(formData.content?.mcqs, (mcqs) => {
    handleContentChange('mcqs', mcqs)
  })

  const { validateAssessmentForm, showValidationErrors } = useFormValidation()

  const availablePercentage = useMemo(
    () =>
      editingId
        ? calculateRemainingPercentage(existingAssessments, editingId)
        : remainingPercentage,
    [editingId, existingAssessments, remainingPercentage]
  )

  const isEditing = Boolean(editingId)

  useEffect(() => {
    if (propsCourseId && !courseId) {
      setCourseId(propsCourseId)
    }
  }, [propsCourseId, courseId, setCourseId])

  useEffect(() => {
    setAssessmentsLoaded(false)
    setShowForm(!builderMode)
    setEditingId(null)
    resetForm()
  }, [sectionId, builderMode, resetForm])

  const handleLoadAssessments = async () => {
    await fetchExistingAssessments()
    setAssessmentsLoaded(true)
  }

  const handleQuestionsChange = (questions) => {
    handleContentChange('questions', questions)
  }

  const handleStartCreate = () => {
    setEditingId(null)
    resetForm()
    setShowForm(true)
  }

  const handleStartEdit = (assessment) => {
    setEditingId(assessment._id)
    loadFormData(assessment)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setEditingId(null)
    resetForm()
    if (builderMode) {
      setShowForm(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateAssessmentForm(formData, sectionId, availablePercentage)
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }

    setSubmitting(true)

    try {
      const result = isEditing
        ? await updateAssessment(editingId, formData, courseId, unitId, sectionId)
        : await submitAssessment(formData, courseId, unitId, sectionId)

      if (result.success) {
        setSuccess(result.message)
        onNotify?.(result.message, 'success')
        setTimeout(async () => {
          resetForm()
          setEditingId(null)
          await fetchExistingAssessments()
          setAssessmentsLoaded(true)
          if (builderMode) {
            setShowForm(false)
          }
        }, 1200)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const renderAssessmentContent = () => {
    switch (formData.assessmentType) {
      case 'MCQ':
        return (
          <MCQForm
            mcqs={formData.content.mcqs || []}
            mcqOptionCounts={mcqOptionCounts}
            onMCQChange={handleMCQChange}
            onMCQOptionChange={handleMCQOptionChange}
            onAddMCQ={addMCQ}
            onRemoveMCQ={removeMCQ}
            onSetTotalOptions={setTotalOptions}
            onMCQFileChange={handleMCQFileChange}
            disabled={isSubmitting}
          />
        )
      case 'QNA':
        return (
          <QNAForm
            questions={formData.content.questions || []}
            onQuestionsChange={handleQuestionsChange}
            disabled={isSubmitting}
          />
        )
      case 'FILE':
        return (
          <FileAssessmentForm
            assessmentFile={formData.content.assessmentFile}
            supportingFile={formData.content.supportingFile}
            onAssessmentFileChange={(file) => handleContentChange('assessmentFile', file)}
            onSupportingFileChange={(file) => handleContentChange('supportingFile', file)}
            readOnly={isEditing}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={isSubmitting}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {isEditing ? 'Updating Assessment...' : 'Uploading Assessment...'}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
          Please wait while we process your assessment
        </Typography>
        <Box sx={{ width: 300, mt: 2 }}>
          <LinearProgress
            variant={uploadProgress > 0 ? 'determinate' : 'indeterminate'}
            value={uploadProgress}
          />
          {uploadProgress > 0 && (
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
              {uploadProgress}% uploaded
            </Typography>
          )}
        </Box>
      </Backdrop>

      <SuccessMessage message={successMessage} />
      <ErrorMessage message={errorMessage} />

      <form onSubmit={handleSubmit}>
        <FormSection>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
            {!builderMode && (
              <CourseSelector
                courses={courses}
                value={courseId}
                onChange={setCourseId}
                disabled={isSubmitting || isEditing}
              />
            )}
            <UnitSelector
              units={units}
              value={unitId}
              onChange={setUnitId}
              disabled={!courseId || isSubmitting || isEditing}
            />
            <SectionSelector
              sections={sections}
              value={sectionId}
              onChange={setSectionId}
              disabled={!unitId || isSubmitting || isEditing}
            />
          </Box>
        </FormSection>

        {sectionId && builderMode && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLoadAssessments}
              sx={{ borderRadius: '8px' }}
            >
              Load assessments
            </Button>
            <Button
              startIcon={<AddIcon />}
              size="small"
              variant="contained"
              onClick={handleStartCreate}
              sx={{ borderRadius: '8px' }}
            >
              Add assessment
            </Button>
          </Box>
        )}

        {sectionId && assessmentsLoaded && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              borderColor: 'rgba(10, 37, 64, 0.12)',
              mb: 1.5
            }}
          >
            {existingAssessments.length === 0 ? (
              <Box sx={{ px: 2, py: 2.5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No assessments in this section yet.
                </Typography>
              </Box>
            ) : (
              existingAssessments.map((assessment, index) => (
                <Box
                  key={assessment._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderBottom:
                      index < existingAssessments.length - 1
                        ? '1px solid rgba(10, 37, 64, 0.08)'
                        : 'none',
                    bgcolor:
                      editingId === assessment._id
                        ? 'rgba(31, 126, 194, 0.08)'
                        : index % 2 === 0
                          ? '#fff'
                          : 'rgba(245, 248, 251, 0.7)'
                  }}
                >
                  <Chip
                    label={assessment.assessmentType}
                    size="small"
                    sx={{ fontWeight: 700, minWidth: 52 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                      {assessment.title || `${assessment.assessmentType} assessment`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assessment.totalMarks} marks · {assessment.percentage}% of section
                      {assessment.interval ? ` · due in ${assessment.interval} days` : ''}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Edit assessment"
                    onClick={() => handleStartEdit(assessment)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Permanently delete assessment"
                    onClick={() =>
                      setDeleteTarget({
                        id: assessment._id,
                        name:
                          assessment.title ||
                          `${assessment.assessmentType} assessment (${assessment.percentage}%)`
                      })
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))
            )}
          </Paper>
        )}

        {sectionId && builderMode && !assessmentsLoaded && !showForm && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Load existing assessments or click &quot;Add assessment&quot; to create a new one.
          </Alert>
        )}

        {showForm && (
          <>
            <Alert severity={isEditing ? 'info' : 'success'} sx={{ mb: 1.5 }}>
              {isEditing
                ? formData.assessmentType === 'FILE'
                  ? 'Editing assessment settings. Uploaded files stay unchanged.'
                  : 'Editing assessment content and settings.'
                : 'Creating a new assessment.'}
            </Alert>

            <FormSection>
              <AssessmentBasicInfo
                title={formData.title}
                onTitleChange={(value) => handleFormChange('title', value)}
                disabled={isSubmitting}
              />
            </FormSection>

            {formData.assessmentType !== 'MCQ' && (
              <FormSection>
                <RoleSelectionForm
                  assessors={assessors}
                  moderators={moderators}
                  verifiers={verifiers}
                  assessorId={formData.assessor}
                  moderatorId={formData.moderator}
                  verifierId={formData.verifier}
                  onAssessorChange={(value) => handleFormChange('assessor', value)}
                  onModeratorChange={(value) => handleFormChange('moderator', value)}
                  onVerifierChange={(value) => handleFormChange('verifier', value)}
                  disabled={isSubmitting}
                />
              </FormSection>
            )}

            <FormSection>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <AssessmentTypeSelector
                  value={formData.assessmentType}
                  onChange={(value) => {
                    handleFormChange('assessmentType', value)
                    if (value === 'MCQ') {
                      handleFormChange('assessor', '')
                      handleFormChange('moderator', '')
                      handleFormChange('verifier', '')
                    }
                  }}
                  disabled={isSubmitting || isEditing}
                />
              </Box>
              <AssessmentMetrics
                totalMarks={formData.totalMarks}
                percentage={formData.percentage}
                interval={formData.interval}
                remainingPercentage={availablePercentage}
                onTotalMarksChange={(value) => handleFormChange('totalMarks', value)}
                onPercentageChange={(value) => handleFormChange('percentage', value)}
                onIntervalChange={(value) => handleFormChange('interval', value)}
                disabled={isSubmitting}
              />
            </FormSection>

            <FormSection title="Assessment Content">{renderAssessmentContent()}</FormSection>

            <FormSection>
              <TimeOptionsForm
                isTimeBound={formData.isTimeBound}
                timeAllowed={formData.timeAllowed}
                onTimeBoundChange={(value) => handleFormChange('isTimeBound', value)}
                onTimeAllowedChange={(value) => handleFormChange('timeAllowed', value)}
                showTimeOptions={shouldShowTimeOptions(formData.assessmentType)}
                disabled={isSubmitting}
              />
            </FormSection>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
              {(builderMode || isEditing) && (
                <Button onClick={handleCancelForm} disabled={isSubmitting} sx={{ mt: 2 }}>
                  Cancel
                </Button>
              )}
              <SubmitButton
                isSubmitting={isSubmitting}
                disabled={!sectionId}
                label={isEditing ? 'Save changes' : 'Create Assessment'}
                loadingLabel={isEditing ? 'Saving…' : 'Creating Assessment...'}
              />
            </Box>
          </>
        )}
      </form>

      <HardDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        entityType="assessment"
        entityId={deleteTarget?.id}
        entityName={deleteTarget?.name}
        onDeleted={async () => {
          const deletedId = deleteTarget?.id
          setDeleteTarget(null)
          if (editingId && String(editingId) === String(deletedId)) {
            handleCancelForm()
          }
          await fetchExistingAssessments()
          onNotify?.('Assessment permanently deleted.', 'success')
        }}
      />
    </>
  )
}

AddAssessment.propTypes = {
  courseId: PropTypes.string,
  editMode: PropTypes.bool,
  builderMode: PropTypes.bool,
  onNotify: PropTypes.func
}

AddAssessment.defaultProps = {
  courseId: null,
  editMode: false,
  builderMode: false,
  onNotify: undefined
}

export default AddAssessment
