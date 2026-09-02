import { Box, Typography, Backdrop, CircularProgress, LinearProgress, Alert, Button, Chip, Paper } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useAssessmentForm } from './hooks/useAssessmentForm'
import { useHierarchyData } from './hooks/useHierarchyData'
import { useAssessmentAPI } from './hooks/useAssessmentAPI'
import { useMCQManagement } from './hooks/useMCQManagement'
import { useFormValidation } from './hooks/useFormValidation'
import { shouldShowTimeOptions } from './utils/assessmentHelpers'
import { createNewQuestion } from './utils/assessmentHelpers'

// UI Components
import FormSection from './components/ui/FormSection'
import SuccessMessage from './components/ui/SuccessMessage'
import ErrorMessage from './components/ui/ErrorMessage'
import SubmitButton from './components/ui/SubmitButton'

// Selector Components
import CourseSelector from './components/selectors/CourseSelector'
import UnitSelector from './components/selectors/UnitSelector'
import SectionSelector from './components/selectors/SectionSelector'

// Form Components
import AssessmentBasicInfo from './components/forms/AssessmentBasicInfo'
import AssessmentTypeSelector from './components/forms/AssessmentTypeSelector'
import AssessmentMetrics from './components/forms/AssessmentMetrics'
import RoleSelectionForm from './components/forms/RoleSelectionForm'
import TimeOptionsForm from './components/forms/TimeOptionsForm'
import MCQForm from './components/forms/MCQForm'
import QNAForm from './components/forms/QNAForm'
import FileAssessmentForm from './components/forms/FileAssessmentForm'

/**
 * Refactored AddAssessment component using compartmentalized structure
 */
const AddAssessment = ({ courseId: propsCourseId, editMode, builderMode = false }) => {
  const [assessmentsLoaded, setAssessmentsLoaded] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(!builderMode)
  // Form state management
  const {
    formData,
    isSubmitting,
    successMessage,
    errorMessage,
    handleFormChange,
    handleContentChange,
    resetForm,
    setSubmitting,
    setSuccess,
    setError
  } = useAssessmentForm()

  // Hierarchy data management
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

  // API operations
  const {
    assessors,
    moderators,
    verifiers,
    submitAssessment,
    uploadProgress
  } = useAssessmentAPI()

  // MCQ management
  const {
    mcqOptionCounts,
    addMCQ,
    removeMCQ,
    handleMCQChange,
    handleMCQOptionChange,
    addMCQOption,
    removeMCQOption,
    handleMCQFileChange,
    setTotalOptions
  } = useMCQManagement(formData.content?.mcqs, (mcqs) => {
    handleContentChange('mcqs', mcqs)
  })

  // Form validation
  const {
    validateAssessmentForm,
    showValidationErrors
  } = useFormValidation()

  // Initialize courseId if passed as prop
  useEffect(() => {
    if (propsCourseId && !courseId) {
      setCourseId(propsCourseId)
    }
  }, [propsCourseId, courseId, setCourseId])

  useEffect(() => {
    setAssessmentsLoaded(false)
    setShowCreateForm(!builderMode)
  }, [sectionId, builderMode])

  const handleLoadAssessments = async () => {
    await fetchExistingAssessments()
    setAssessmentsLoaded(true)
  }

  // Handle Questions for QNA
  const handleQuestionsChange = (questions) => {
    handleContentChange('questions', questions)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validation = validateAssessmentForm(formData, sectionId, remainingPercentage)
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }

    setSubmitting(true)
    
    try {
      const result = await submitAssessment(formData, courseId, unitId, sectionId)
      
      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => {
          resetForm()
          fetchExistingAssessments()
          setAssessmentsLoaded(true)
          if (builderMode) {
            setShowCreateForm(false)
          }
        }, 2000)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Render assessment type specific content
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
          />
        )
      case 'FILE':
        return (
          <FileAssessmentForm
            assessmentFile={formData.content.assessmentFile}
            supportingFile={formData.content.supportingFile}
            onAssessmentFileChange={(file) => handleContentChange('assessmentFile', file)}
            onSupportingFileChange={(file) => handleContentChange('supportingFile', file)}
          />
        )
      default:
        return null
    }
  }

  return (
    <> 
      {/* Loading Backdrop */}
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
          Uploading Assessment...
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
          Please wait while we process your files and create the assessment
        </Typography>
        <Box sx={{ width: 300, mt: 2 }}>
          <LinearProgress 
            variant={uploadProgress > 0 ? "determinate" : "indeterminate"}
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
                disabled={isSubmitting}
              />
            )}
            <UnitSelector
              units={units}
              value={unitId}
              onChange={setUnitId}
              disabled={!courseId || isSubmitting}
            />
            <SectionSelector
              sections={sections}
              value={sectionId}
              onChange={setSectionId}
              disabled={!unitId || isSubmitting}
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
              onClick={() => setShowCreateForm(true)}
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
                    bgcolor: index % 2 === 0 ? '#fff' : 'rgba(245, 248, 251, 0.7)'
                  }}
                >
                  <Chip
                    label={assessment.assessmentType}
                    size="small"
                    sx={{ fontWeight: 700, minWidth: 52 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                      {assessment.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assessment.totalMarks} marks · {assessment.percentage}% of section
                      {assessment.interval ? ` · due in ${assessment.interval} days` : ''}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        )}

        {sectionId && builderMode && !assessmentsLoaded && !showCreateForm && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Load existing assessments or click &quot;Add assessment&quot; to create a new one.
          </Alert>
        )}

        {showCreateForm && (
          <>
        {/* Basic Assessment Information */}
        <FormSection>
          <AssessmentBasicInfo
            title={formData.title}
            onTitleChange={(value) => handleFormChange('title', value)}
            disabled={isSubmitting}
          />
        </FormSection>

        {/* Role selection — manual grading only (QNA / FILE) */}
        {formData.assessmentType !== 'MCQ' && (
          <FormSection>
            <RoleSelectionForm
              assessors={assessors}
              moderators={moderators}
              verifiers={verifiers}
              onAssessorChange={(value) => handleFormChange('assessor', value)}
              onModeratorChange={(value) => handleFormChange('moderator', value)}
              onVerifierChange={(value) => handleFormChange('verifier', value)}
            />
          </FormSection>
        )}

        {/* Assessment Type and Metrics */}
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
              disabled={isSubmitting}
            />
          </Box>
          <AssessmentMetrics
            totalMarks={formData.totalMarks}
            percentage={formData.percentage}
            interval={formData.interval}
            remainingPercentage={remainingPercentage}
            onTotalMarksChange={(value) => handleFormChange('totalMarks', value)}
            onPercentageChange={(value) => handleFormChange('percentage', value)}
            onIntervalChange={(value) => handleFormChange('interval', value)}
            disabled={isSubmitting}
          />
        </FormSection>

        {/* Assessment Content */}
        <FormSection title="Assessment Content">
          {renderAssessmentContent()}
        </FormSection>

        {/* Time Options */}
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

        <SubmitButton
          isSubmitting={isSubmitting}
          disabled={!sectionId}
        />
          </>
        )}
      </form>
    </>
  )
}

AddAssessment.propTypes = {
  courseId: PropTypes.string,
  editMode: PropTypes.bool,
  builderMode: PropTypes.bool
}

AddAssessment.defaultProps = {
  courseId: null,
  editMode: false,
  builderMode: false
}

export default AddAssessment
