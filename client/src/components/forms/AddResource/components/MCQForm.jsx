import {
  Box,
  TextField,
  Autocomplete,
  Checkbox,
  Typography,
  Alert
} from '@mui/material'
import PropTypes from 'prop-types'
import FileUploader from './FileUploader'
import { useCallback, useState } from 'react'

const MCQForm = ({ content, onChange, editMode }) => {
  const [error, setError] = useState('')

  const handleOptionChange = useCallback((index, value) => {
    const newOptions = [...content.mcq.options]
    newOptions[index] = value
    onChange('mcq', {
      ...content.mcq,
      options: newOptions
    })
  }, [content.mcq, onChange])

  const handleCorrectAnswersChange = useCallback((_, newValue) => {
    if (newValue.length > content.mcq.numberOfCorrectAnswers) {
      setError(`Please select exactly ${content.mcq.numberOfCorrectAnswers} correct answer(s)`)
      return
    }
    setError('')
    onChange('mcq', {
      ...content.mcq,
      correctAnswers: newValue
    })
  }, [content.mcq, onChange])

  const handleNumberOfOptionsChange = useCallback((_, newValue) => {
    if (!newValue) return
    
    const numOptions = newValue.value
    const currentOptions = content.mcq?.options || []
    const newOptions = Array(numOptions)
      .fill('')
      .map((_, i) => currentOptions[i] || '')
    
    // Update number of correct answers to be one less than total options
    const newNumCorrect = Math.max(1, numOptions - 1)
    
    onChange('mcq', {
      ...content.mcq,
      options: newOptions,
      numberOfCorrectAnswers: newNumCorrect,
      correctAnswers: [] // Reset correct answers when options change
    })
  }, [content.mcq, onChange])

  const handleNumberOfCorrectAnswersChange = useCallback((_, newValue) => {
    if (!newValue) return
    
    const numCorrect = newValue.value
    onChange('mcq', {
      ...content.mcq,
      numberOfCorrectAnswers: numCorrect,
      correctAnswers: content.mcq.correctAnswers.slice(0, numCorrect)
    })
  }, [content.mcq, onChange])

  const optionNumbers = [2, 3, 4, 5, 6].map(num => ({
    value: num,
    label: `${num} Options`
  }))

  const correctAnswerNumbers = Array.from(
    { length: Math.max(1, (content.mcq?.options?.length || 4) - 1) },
    (_, i) => ({
      value: i + 1,
      label: `${i + 1} Correct Answer${i > 0 ? 's' : ''}`
    })
  )

  return (
    <Box>
      <TextField
        fullWidth
        size='small'
        label='Question'
        value={content.mcq?.question || ''}
        onChange={e => onChange('mcq', {
          ...content.mcq,
          question: e.target.value
        })}
        required
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              border: '1px solid #20202033'
            }
          },
          '& .MuiInputLabel-root': {
            backgroundColor: 'white',
            padding: '0 4px',
            '&.Mui-focused': {
              color: 'primary.main'
            }
          }
        }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          fullWidth
          size='small'
          options={optionNumbers}
          getOptionLabel={option => option.label}
          value={optionNumbers.find(opt => opt.value === (content.mcq?.options?.length || 4)) || null}
          onChange={handleNumberOfOptionsChange}
          renderInput={params => (
            <TextField
              {...params}
              label='Number of Options'
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    border: '1px solid #20202033'
                  }
                },
                '& .MuiInputLabel-root': {
                  backgroundColor: 'white',
                  padding: '0 4px',
                  '&.Mui-focused': {
                    color: 'primary.main'
                  }
                }
              }}
            />
          )}
        />

        <Autocomplete
          fullWidth
          size='small'
          options={correctAnswerNumbers}
          getOptionLabel={option => option.label}
          value={correctAnswerNumbers.find(opt => opt.value === (content.mcq?.numberOfCorrectAnswers || 1)) || null}
          onChange={handleNumberOfCorrectAnswersChange}
          renderInput={params => (
            <TextField
              {...params}
              label='Number of Correct Answers'
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    border: '1px solid #20202033'
                  }
                },
                '& .MuiInputLabel-root': {
                  backgroundColor: 'white',
                  padding: '0 4px',
                  '&.Mui-focused': {
                    color: 'primary.main'
                  }
                }
              }}
            />
          )}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {content.mcq?.options?.map((option, index) => {
          // Only render every other option as the first option in a row
          if (index % 2 !== 0) return null;

          const isLastOption = index === content.mcq.options.length - 1;
          const isOddTotal = content.mcq.options.length % 2 !== 0;

          return (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                gap: 2,
                width: '100%'
              }}
            >
              <TextField
                fullWidth={!isLastOption || !isOddTotal}
                size='small'
                label={`Option ${index + 1}`}
                value={option}
                onChange={e => handleOptionChange(index, e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      border: '1px solid #20202033'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    padding: '0 4px',
                    '&.Mui-focused': {
                      color: 'primary.main'
                    }
                  }
                }}
              />
              {index + 1 < content.mcq?.options?.length && (
                <TextField
                  fullWidth
                  size='small'
                  label={`Option ${index + 2}`}
                  value={content.mcq.options[index + 1]}
                  onChange={e => handleOptionChange(index + 1, e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        border: '1px solid #20202033'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      backgroundColor: 'white',
                      padding: '0 4px',
                      '&.Mui-focused': {
                        color: 'primary.main'
                      }
                    }
                  }}
                />
              )}
            </Box>
          )
        })}
      </Box>

      <Autocomplete
        multiple
        fullWidth
        size='small'
        options={content.mcq?.options || []}
        value={content.mcq?.correctAnswers || []}
        onChange={handleCorrectAnswersChange}
        renderInput={params => (
          <TextField
            {...params}
            label='Correct Answers'
            error={!!error}
            helperText={error}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': {
                  border: '1px solid #20202033'
                }
              },
              '& .MuiInputLabel-root': {
                backgroundColor: 'white',
                padding: '0 4px',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
          />
        )}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox checked={selected} />
            <Typography>
              Option {content.mcq.options.indexOf(option) + 1}: {option}
            </Typography>
          </li>
        )}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FileUploader
          label="MCQ Image"
          accept="image/*"
          value={content.mcq?.imageFile}
          onChange={(file) => onChange('mcq', {
            ...content.mcq,
            imageFile: file
          })}
          editMode={editMode}
          existingFile={content.mcq?.imageFile}
          type="secondary"
        />
        <FileUploader
          label="MCQ Audio"
          accept="audio/*"
          value={content.mcq?.audioFile}
          onChange={(file) => onChange('mcq', {
            ...content.mcq,
            audioFile: file
          })}
          editMode={editMode}
          existingFile={content.mcq?.audioFile}
          type="secondary"
        />
      </Box>
    </Box>
  )
}

MCQForm.propTypes = {
  content: PropTypes.shape({
    mcq: PropTypes.shape({
      question: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.string),
      numberOfCorrectAnswers: PropTypes.number,
      correctAnswers: PropTypes.arrayOf(PropTypes.string),
      imageFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      audioFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
    })
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  editMode: PropTypes.bool
}

export default MCQForm 