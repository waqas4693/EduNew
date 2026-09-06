import { Box, TextField, Button, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'
import { QuestionPropTypes } from '../../types/assessmentTypes'

/**
 * Questions and Answers form component
 */
const QNAForm = ({ questions, onQuestionsChange, disabled = false }) => {
  const addQuestion = () => {
    const newQuestions = [...questions, { question: '', answer: '' }]
    onQuestionsChange(newQuestions)
  }

  const removeQuestion = (indexToRemove) => {
    const updatedQuestions = questions.filter((_, index) => index !== indexToRemove)
    onQuestionsChange(updatedQuestions)
  }

  const handleFieldChange = (index, field, value) => {
    const newQuestions = [...questions]
    newQuestions[index] = {
      question: newQuestions[index]?.question || '',
      answer: newQuestions[index]?.answer || '',
      [field]: value
    }
    onQuestionsChange(newQuestions)
  }

  return (
    <Box>
      {questions.map((q, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            mb: 2,
            p: 1.5,
            borderRadius: '8px',
            border: '1px solid rgba(10, 37, 64, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label={`Question ${index + 1}`}
              value={q.question || ''}
              onChange={(e) => handleFieldChange(index, 'question', e.target.value)}
              disabled={disabled}
              sx={FORM_FIELD_STYLES.textField}
            />
            <IconButton
              onClick={() => removeQuestion(index)}
              color="error"
              disabled={disabled}
              aria-label={`Remove question ${index + 1}`}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label={`Model answer ${index + 1} (optional)`}
            value={q.answer || ''}
            onChange={(e) => handleFieldChange(index, 'answer', e.target.value)}
            disabled={disabled}
            sx={FORM_FIELD_STYLES.textField}
          />
        </Box>
      ))}
      <Button startIcon={<AddIcon />} onClick={addQuestion} disabled={disabled}>
        Add Question
      </Button>
    </Box>
  )
}

QNAForm.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.shape(QuestionPropTypes)).isRequired,
  onQuestionsChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default QNAForm
