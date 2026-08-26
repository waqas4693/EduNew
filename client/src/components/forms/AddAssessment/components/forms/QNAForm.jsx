import { Box, TextField, Button, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'
import { QuestionPropTypes } from '../../types/assessmentTypes'

/**
 * Questions and Answers form component
 */
const QNAForm = ({ questions, onQuestionsChange }) => {
  const addQuestion = () => {
    const newQuestions = [...questions, { question: '' }]
    onQuestionsChange(newQuestions)
  }

  const removeQuestion = (indexToRemove) => {
    const updatedQuestions = questions.filter((_, index) => index !== indexToRemove)
    onQuestionsChange(updatedQuestions)
  }

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions]
    newQuestions[index] = { question: value }
    onQuestionsChange(newQuestions)
  }

  return (
    <Box>
      {questions.map((q, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            size="small"
            label={`Question ${index + 1}`}
            value={q.question}
            onChange={e => handleQuestionChange(index, e.target.value)}
            sx={FORM_FIELD_STYLES.textField}
          />
          <IconButton onClick={() => removeQuestion(index)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button startIcon={<AddIcon />} onClick={addQuestion}>
        Add Question
      </Button>
    </Box>
  )
}

QNAForm.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.shape(QuestionPropTypes)).isRequired,
  onQuestionsChange: PropTypes.func.isRequired
}

export default QNAForm
