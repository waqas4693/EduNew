import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useEffect } from 'react'
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
const AddAssessment = ({ courseId: propsCourseId, editMode }) => {
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
    remainingPercentage,
    setCourseId,
    setUnitId,
    setSectionId,
    fetchExistingAssessments
  } = useHierarchyData()

  // API operations
  const {
    assessors,
    moderators,
    verifiers,
    submitAssessment
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
      <SuccessMessage message={successMessage} />
      <ErrorMessage message={errorMessage} />
      
      <form onSubmit={handleSubmit}>
        {/* Course/Unit/Section Selection */}
        <FormSection>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <CourseSelector
              courses={courses}
              value={courseId}
              onChange={setCourseId}
            />
            <UnitSelector
              units={units}
              value={unitId}
              onChange={setUnitId}
              disabled={!courseId}
            />
            <SectionSelector
              sections={sections}
              value={sectionId}
              onChange={setSectionId}
              disabled={!unitId}
            />
          </Box>
        </FormSection>

        {/* Basic Assessment Information */}
        <FormSection>
          <AssessmentBasicInfo
            title={formData.title}
            onTitleChange={(value) => handleFormChange('title', value)}
          />
        </FormSection>

        {/* Role Selection */}
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

        {/* Assessment Type and Metrics */}
        <FormSection>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <AssessmentTypeSelector
              value={formData.assessmentType}
              onChange={(value) => handleFormChange('assessmentType', value)}
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
          />
        </FormSection>

        <SubmitButton
          isSubmitting={isSubmitting}
          disabled={!sectionId}
        />
      </form>
    </>
  )
}

AddAssessment.propTypes = {
  courseId: PropTypes.string,
  editMode: PropTypes.bool
}

AddAssessment.defaultProps = {
  courseId: null,
  editMode: false
}

export default AddAssessment
