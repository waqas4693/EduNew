import { Box, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PropTypes from 'prop-types'
import { MCQPropTypes } from '../../../types/assessmentTypes'
import MCQItem from './MCQItem'

/**
 * Main MCQ form component
 */
const MCQForm = ({ 
  mcqs, 
  mcqOptionCounts,
  onMCQChange,
  onMCQOptionChange,
  onAddMCQ,
  onRemoveMCQ,
  onSetTotalOptions,
  onMCQFileChange
}) => {
  console.log('MCQForm render - mcqs:', mcqs?.length, 'mcqOptionCounts:', mcqOptionCounts)

  return (
    <Box>
      {mcqs.map((mcq, index) => {
        const optionCount = mcqOptionCounts[index] || mcq.options?.length || 2
        
        return (
          <MCQItem
            key={index}
            mcq={mcq}
            mcqIndex={index}
            optionCount={optionCount}
            onMCQChange={onMCQChange}
            onMCQOptionChange={onMCQOptionChange}
            onSetTotalOptions={onSetTotalOptions}
            onMCQFileChange={onMCQFileChange}
            onRemoveMCQ={onRemoveMCQ}
          />
        )
      })}
      
      <Button startIcon={<AddIcon />} onClick={onAddMCQ}>
        Add MCQ
      </Button>
    </Box>
  )
}

MCQForm.propTypes = {
  mcqs: PropTypes.arrayOf(PropTypes.shape(MCQPropTypes)).isRequired,
  mcqOptionCounts: PropTypes.object.isRequired,
  onMCQChange: PropTypes.func.isRequired,
  onMCQOptionChange: PropTypes.func.isRequired,
  onAddMCQ: PropTypes.func.isRequired,
  onRemoveMCQ: PropTypes.func.isRequired,
  onSetTotalOptions: PropTypes.func.isRequired,
  onMCQFileChange: PropTypes.func.isRequired
}

export default MCQForm
