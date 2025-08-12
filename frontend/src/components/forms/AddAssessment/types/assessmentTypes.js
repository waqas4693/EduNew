import PropTypes from 'prop-types'

/**
 * PropTypes definitions for assessment components
 */

export const MCQPropTypes = {
  question: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string),
  numberOfCorrectAnswers: PropTypes.number,
  correctAnswers: PropTypes.arrayOf(PropTypes.string),
  imageFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  audioFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
}

export const QuestionPropTypes = {
  question: PropTypes.string
}

export const ContentPropTypes = {
  mcqs: PropTypes.arrayOf(PropTypes.shape(MCQPropTypes)),
  questions: PropTypes.arrayOf(PropTypes.shape(QuestionPropTypes)),
  assessmentFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  supportingFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
}

export const FormDataPropTypes = {
  assessmentType: PropTypes.oneOf(['MCQ', 'QNA', 'FILE']),
  title: PropTypes.string,
  description: PropTypes.string,
  totalMarks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  interval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isTimeBound: PropTypes.bool,
  timeAllowed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  content: PropTypes.shape(ContentPropTypes)
}

export const UserPropTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string,
  role: PropTypes.string
}

export const CoursePropTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
}

export const UnitPropTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
}

export const SectionPropTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
}

export const AssessmentPropTypes = {
  _id: PropTypes.string,
  title: PropTypes.string,
  percentage: PropTypes.number,
  assessmentType: PropTypes.string
}
