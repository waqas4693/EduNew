import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { postData, getData } from '../../api/api'

const ASSESSMENT_TYPES = [
  { value: 'QNA', label: 'Questions and Answers' },
  { value: 'MCQ', label: 'Multiple Choice Questions' },
  { value: 'FILE', label: 'File Based Assessment' }
]

const AddAssessment = () => {
  const [formData, setFormData] = useState({
    assessmentType: '',
    totalMarks: '',
    percentage: '',
    content: {
      questions: [],
      mcqs: [],
      assessmentFile: null,
      supportingFile: null
    }
  })
  
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [existingAssessments, setExistingAssessments] = useState([])
  const [remainingPercentage, setRemainingPercentage] = useState(100)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId) {
      fetchUnits()
    }
  }, [courseId])

  useEffect(() => {
    if (unitId) {
      fetchSections()
    }
  }, [unitId])

  useEffect(() => {
    if (sectionId) {
      fetchExistingAssessments()
    }
  }, [sectionId])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const fetchExistingAssessments = async () => {
    try {
      const response = await getData(`assessments/${sectionId}`)
      if (response.status === 200) {
        setExistingAssessments(response.data.assessments)
        calculateRemainingPercentage(response.data.assessments)
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  const calculateRemainingPercentage = (assessments) => {
    const totalUsedPercentage = assessments.reduce((sum, assessment) => sum + assessment.percentage, 0)
    setRemainingPercentage(100 - totalUsedPercentage)
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        questions: [...prev.content.questions, { question: '' }]
      }
    }))
  }

  const addMCQ = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        mcqs: [...prev.content.mcqs, {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: ''
        }]
      }
    }))
  }

  const handleQuestionChange = (index, value) => {
    setFormData(prev => {
      const newQuestions = [...prev.content.questions]
      newQuestions[index] = { question: value }
      return {
        ...prev,
        content: {
          ...prev.content,
          questions: newQuestions
        }
      }
    })
  }

  const handleMCQChange = (index, field, value, optionIndex = null) => {
    setFormData(prev => {
      const newMCQs = [...prev.content.mcqs]
      if (field === 'options') {
        newMCQs[index].options[optionIndex] = value
      } else {
        newMCQs[index][field] = value
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          mcqs: newMCQs
        }
      }
    })
  }

  const removeQuestion = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        questions: prev.content.questions.filter((_, index) => index !== indexToRemove)
      }
    }))
  }

  const removeMCQ = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        mcqs: prev.content.mcqs.filter((_, index) => index !== indexToRemove)
      }
    }))
  }

  const renderAssessmentTypeFields = () => {
    switch (formData.assessmentType) {
      case 'QNA':
        return (
          <Box>
            {formData.content.questions.map((q, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Question ${index + 1}`}
                  value={q.question}
                  onChange={e => handleQuestionChange(index, e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      border: '1px solid #20202033',
                      '& fieldset': {
                        border: 'none'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#8F8F8F',
                      backgroundColor: 'white',
                      padding: '0 4px'
                    }
                  }}
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

      case 'MCQ':
        return (
          <Box>
            {formData.content.mcqs.map((mcq, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Question ${index + 1}`}
                  value={mcq.question}
                  onChange={e => handleMCQChange(index, 'question', e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      border: '1px solid #20202033',
                      '& fieldset': {
                        border: 'none'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#8F8F8F',
                      backgroundColor: 'white',
                      padding: '0 4px'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {mcq.options.map((option, optionIndex) => (
                    <TextField
                      key={optionIndex}
                      size="small"
                      label={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={e => handleMCQChange(index, 'options', e.target.value, optionIndex)}
                      sx={{
                        width: 'calc(50% - 8px)',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          border: '1px solid #20202033',
                          '& fieldset': {
                            border: 'none'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: '#8F8F8F',
                          backgroundColor: 'white',
                          padding: '0 4px'
                        }
                      }}
                    />
                  ))}
                </Box>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#8F8F8F', backgroundColor: 'white', padding: '0 4px' }}>
                    Correct Answer
                  </InputLabel>
                  <Select
                    value={mcq.correctAnswer}
                    onChange={e => handleMCQChange(index, 'correctAnswer', e.target.value)}
                    sx={{
                      borderRadius: '8px',
                      border: '1px solid #20202033',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }}
                  >
                    {mcq.options.map((option, optionIndex) => (
                      <MenuItem key={optionIndex} value={option}>
                        {option || `Option ${optionIndex + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton onClick={() => removeMCQ(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={addMCQ}>
              Add MCQ
            </Button>
          </Box>
        )

      case 'FILE':
        return (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #20202033',
                '&:hover': {
                  border: '1px solid #20202033',
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {formData.content.assessmentFile
                ? formData.content.assessmentFile.name
                : 'Choose Assessment File'}
              <input
                type="file"
                hidden
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    assessmentFile: e.target.files[0]
                  })
                }
              />
            </Button>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #20202033',
                '&:hover': {
                  border: '1px solid #20202033',
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {formData.content.supportingFile
                ? formData.content.supportingFile.name
                : 'Choose Supporting File'}
              <input
                type="file"
                hidden
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    supportingFile: e.target.files[0]
                  })
                }
              />
            </Button>
          </Box>
        )

      default:
        return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!validateForm()) {
        return
      }

      const assessmentData = {
        assessmentType: formData.assessmentType,
        totalMarks: formData.totalMarks,
        percentage: formData.percentage,
        sectionId: sectionId,
        content: formData.content
      }

      const response = await postData('assessments', assessmentData)
      if (response.status === 201) {
        resetForm()
        alert('Assessment added successfully')
      }
    } catch (error) {
      console.error('Error adding assessment:', error)
      alert('Error adding assessment. Please try again.')
    }
  }

  const validateForm = () => {
    if (!sectionId || !formData.assessmentType || !formData.totalMarks || !formData.percentage) {
      alert('Please fill all required fields')
      return false
    }

    if (Number(formData.percentage) > remainingPercentage) {
      alert(`Percentage cannot exceed ${remainingPercentage}%`)
      return false
    }

    // Add more validation based on assessment type
    return true
  }

  const resetForm = () => {
    setFormData({
      assessmentType: '',
      totalMarks: '',
      percentage: '',
      content: {
        questions: [],
        mcqs: [],
        assessmentFile: null,
        supportingFile: null
      }
    })
    fetchExistingAssessments()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Autocomplete
          fullWidth
          size="small"
          options={courses}
          getOptionLabel={option => option.name}
          onChange={(_, newValue) => setCourseId(newValue?._id)}
          renderInput={params => (
            <TextField
              {...params}
              size="small"
              label="Select Course"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  border: '1px solid #20202033',
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#8F8F8F',
                  backgroundColor: 'white',
                  padding: '0 4px'
                }
              }}
            />
          )}
        />
        <Autocomplete
          fullWidth
          size="small"
          options={units}
          getOptionLabel={option => option.name}
          onChange={(_, newValue) => setUnitId(newValue?._id)}
          disabled={!courseId}
          renderInput={params => (
            <TextField
              {...params}
              size="small"
              label="Select Unit"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  border: '1px solid #20202033',
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#8F8F8F',
                  backgroundColor: 'white',
                  padding: '0 4px'
                }
              }}
            />
          )}
        />
        <Autocomplete
          fullWidth
          size="small"
          options={sections}
          getOptionLabel={option => option.name}
          onChange={(_, newValue) => setSectionId(newValue?._id)}
          disabled={!unitId}
          renderInput={params => (
            <TextField
              {...params}
              size="small"
              label="Select Section"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  border: '1px solid #20202033',
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#8F8F8F',
                  backgroundColor: 'white',
                  padding: '0 4px'
                }
              }}
            />
          )}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: '#8F8F8F', backgroundColor: 'white', padding: '0 4px' }}>
            Assessment Type
          </InputLabel>
          <Select
            value={formData.assessmentType}
            onChange={e => handleFormChange('assessmentType', e.target.value)}
            required
            sx={{
              borderRadius: '8px',
              border: '1px solid #20202033',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }
            }}
          >
            {ASSESSMENT_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Total Marks"
          value={formData.totalMarks}
          onChange={e => handleFormChange('totalMarks', e.target.value)}
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              border: '1px solid #20202033',
              '& fieldset': {
                border: 'none'
              }
            },
            '& .MuiInputLabel-root': {
              color: '#8F8F8F',
              backgroundColor: 'white',
              padding: '0 4px'
            }
          }}
        />
        <TextField
          fullWidth
          size="small"
          type="number"
          label={`Percentage (Remaining: ${remainingPercentage}%)`}
          value={formData.percentage}
          onChange={e => handleFormChange('percentage', e.target.value)}
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              border: '1px solid #20202033',
              '& fieldset': {
                border: 'none'
              }
            },
            '& .MuiInputLabel-root': {
              color: '#8F8F8F',
              backgroundColor: 'white',
              padding: '0 4px'
            }
          }}
        />
      </Box>

      {renderAssessmentTypeFields()}

      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center' }}>

      {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 30,
              height: 30,
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <AddIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
            Add Assessment
          </Typography>
        </Box> */}
        <Button
          type="submit"
          variant="contained"
          sx={{ 
            minWidth: '100px',
            width: '100px',
            borderRadius: '8px',
            height: '36px'
          }}
        >
          Save
        </Button>
      </Box>
    </form>
  )
}

export default AddAssessment 