import { Box, TextField, FormControl, InputLabel, Select, MenuItem, OutlinedInput, IconButton, Typography, Checkbox, FormControlLabel, Alert } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../../utils/constants'
import { MCQPropTypes } from '../../../types/assessmentTypes'
import MCQOptions from './MCQOptions'
import MCQFileUpload from './MCQFileUpload'
import { useState, useEffect } from 'react'

/**
 * Individual MCQ item component
 */
const MCQItem = ({ 
  mcq, 
  mcqIndex, 
  optionCount,
  onMCQChange, 
  onMCQOptionChange,
  onSetTotalOptions,
  onMCQFileChange,
  onRemoveMCQ
}) => {
  const [validationError, setValidationError] = useState('')

  // Maximum correct answers = total options - 1
  const maxCorrectAnswers = Math.max(1, optionCount - 1)
  
  // Generate array for correct answers dropdown (1 to maxCorrectAnswers)
  const correctAnswerOptions = Array.from(
    { length: maxCorrectAnswers }, 
    (_, i) => i + 1
  )

  // Validate correct answers selection
  useEffect(() => {
    const selectedCount = (mcq.correctAnswers || []).length
    const maxAllowed = maxCorrectAnswers
    
    if (selectedCount > maxAllowed) {
      setValidationError(`Maximum ${maxAllowed} correct answers allowed (Total options - 1)`)
    } else if (selectedCount > 0 && selectedCount !== mcq.numberOfCorrectAnswers) {
      setValidationError(`Please select exactly ${mcq.numberOfCorrectAnswers} correct answer(s)`)
    } else {
      setValidationError('')
    }
  }, [mcq.correctAnswers, mcq.numberOfCorrectAnswers, maxCorrectAnswers])

  const handleCorrectAnswerChange = (optionValue, isChecked) => {
    const currentCorrectAnswers = mcq.correctAnswers || []
    let newCorrectAnswers

    if (isChecked) {
      // Add to correct answers if not already present
      if (!currentCorrectAnswers.includes(optionValue)) {
        newCorrectAnswers = [...currentCorrectAnswers, optionValue]
      } else {
        newCorrectAnswers = currentCorrectAnswers
      }
    } else {
      // Remove from correct answers
      newCorrectAnswers = currentCorrectAnswers.filter(answer => answer !== optionValue)
    }

    onMCQChange(mcqIndex, 'correctAnswers', newCorrectAnswers)
  }

  return (
    <Box sx={{ border: '1px solid #ddd', p: 2, mb: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          size="small"
          label={`Question ${mcqIndex + 1}`}
          value={mcq.question}
          onChange={e => onMCQChange(mcqIndex, 'question', e.target.value)}
          sx={{
            mb: 2,
            ...FORM_FIELD_STYLES.textField
          }}
        />
        
        <MCQFileUpload
          imageFile={mcq.imageFile}
          audioFile={mcq.audioFile}
          onImageChange={(file) => onMCQFileChange(mcqIndex, 'imageFile', file)}
          onAudioChange={(file) => onMCQFileChange(mcqIndex, 'audioFile', file)}
        />
      </Box>

      <MCQOptions
        options={mcq.options}
        optionCount={optionCount}
        onOptionChange={onMCQOptionChange}
        onSetTotalOptions={onSetTotalOptions}
        mcqIndex={mcqIndex}
      />
      
      {/* Number of Correct Answers Dropdown */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Number of Correct Answers</InputLabel>
          <Select
            value={mcq.numberOfCorrectAnswers || 1}
            onChange={e => onMCQChange(mcqIndex, 'numberOfCorrectAnswers', parseInt(e.target.value))}
            label="Number of Correct Answers"
            sx={FORM_FIELD_STYLES.select}
          >
            {correctAnswerOptions.map((count) => (
              <MenuItem key={count} value={count}>
                {count} Correct Answer{count > 1 ? 's' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary">
          (Maximum: {maxCorrectAnswers})
        </Typography>
      </Box>
      
      {/* Correct Answers Selection with Checkboxes */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          Select Correct Answers:
        </Typography>
        
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {mcq.options.map((option, optIndex) => (
            <FormControlLabel
              key={optIndex}
              control={
                <Checkbox
                  checked={(mcq.correctAnswers || []).includes(option)}
                  onChange={(e) => handleCorrectAnswerChange(option, e.target.checked)}
                  disabled={!option.trim()} // Disable if option is empty
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Option {optIndex + 1}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option || '(Empty option)'}
                  </Typography>
                </Box>
              }
              sx={{ 
                m: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem'
                }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* File Status Display */}
      {mcq.audioFile && (
        <Typography variant="caption" sx={{ display: 'block', mt: 2, mb: 1, color: 'success.main' }}>
          Audio file: {mcq.audioFile.name || 'Audio file uploaded'}
        </Typography>
      )}

      {mcq.imageFile && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'success.main' }}>
          Image file: {mcq.imageFile.name || 'Image file uploaded'}
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <IconButton onClick={() => onRemoveMCQ(mcqIndex)} color="error">
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  )
}

MCQItem.propTypes = {
  mcq: PropTypes.shape(MCQPropTypes).isRequired,
  mcqIndex: PropTypes.number.isRequired,
  optionCount: PropTypes.number.isRequired,
  onMCQChange: PropTypes.func.isRequired,
  onMCQOptionChange: PropTypes.func.isRequired,
  onSetTotalOptions: PropTypes.func.isRequired,
  onMCQFileChange: PropTypes.func.isRequired,
  onRemoveMCQ: PropTypes.func.isRequired
}

export default MCQItem
