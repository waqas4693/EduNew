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
  IconButton,
  FormControlLabel,
  Switch
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { postData, getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'

const ASSESSMENT_TYPES = [
  { value: 'QNA', label: 'Questions and Answers' },
  { value: 'MCQ', label: 'Multiple Choice Questions' },
  { value: 'FILE', label: 'File Based Assessment' }
]

const truncateFileName = (fileName, maxLength = 5) => {
  if (!fileName) return ''
  const extension = fileName.split('.').pop()
  const name = fileName.split('.').slice(0, -1).join('.')
  if (name.length <= maxLength) return fileName
  return `${name.substring(0, maxLength)}...${extension}`
}

const AddAssessment = () => {
  const [formData, setFormData] = useState({
    assessmentType: '',
    totalMarks: '',
    percentage: '',
    interval: '',
    isTimeBound: false,
    timeAllowed: '',
    assessor: null,
    moderator: null,
    verifier: null,
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
  const [assessors, setAssessors] = useState([])
  const [moderators, setModerators] = useState([])
  const [verifiers, setVerifiers] = useState([])

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

  useEffect(() => {
    fetchUsers()
  }, [])

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

  const fetchUsers = async () => {
    try {
      const response = await getData('users/assessment-users')
      if (response.status === 200) {
        const { assessors, moderators, verifiers } = response.data.data
        setAssessors(assessors)
        setModerators(moderators)
        setVerifiers(verifiers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
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
          correctAnswer: '',
          audioFile: null
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

  const handleMCQAudioChange = (index, file) => {
    setFormData(prev => {
      const newMCQs = [...prev.content.mcqs]
      newMCQs[index] = {
        ...newMCQs[index],
        audioFile: file
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

  const handleFileUpload = async (file, type) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${url}upload/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 200) {
        return response.data.fileName
      }
      throw new Error('File upload failed')
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
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
                  multiline
                  rows={4}
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
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
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
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #20202033',
                      minWidth: '150px',
                      '&:hover': {
                        border: '1px solid #20202033',
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <Typography 
                      sx={{ 
                        maxWidth: '130px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {mcq.audioFile ? truncateFileName(mcq.audioFile.name) : 'Add Audio'}
                    </Typography>
                    <input
                      type="file"
                      hidden
                      accept="audio/*"
                      onChange={e => handleMCQAudioChange(index, e.target.files[0])}
                    />
                  </Button>
                </Box>

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

                {mcq.audioFile && (
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'success.main' }}>
                    Audio file uploaded: {mcq.audioFile.name}
                  </Typography>
                )}

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

  const renderTimeOptions = () => {
    if (formData.assessmentType !== 'MCQ') return null;

    return (
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isTimeBound}
                onChange={(e) => handleFormChange('isTimeBound', e.target.checked)}
              />
            }
            label="Time Bound Assessment"
          />
        </FormControl>

        {formData.isTimeBound && (
          <TextField
            fullWidth
            type="number"
            size="small"
            label="Time Allowed (minutes)"
            value={formData.timeAllowed}
            onChange={(e) => handleFormChange('timeAllowed', e.target.value)}
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
      </Box>
    )
  }

  const renderRoleSelections = () => (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Autocomplete
        fullWidth
        size="small"
        options={assessors}
        getOptionLabel={(option) => option.name}
        onChange={(_, newValue) => handleFormChange('assessor', newValue?._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Assessor"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
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
        options={moderators}
        getOptionLabel={(option) => option.name}
        onChange={(_, newValue) => handleFormChange('moderator', newValue?._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Moderator"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
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
        options={verifiers}
        getOptionLabel={(option) => option.name}
        onChange={(_, newValue) => handleFormChange('verifier', newValue?._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Verifier"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #20202033',
                '& fieldset': { border: 'none' }
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
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!validateForm()) {
        return
      }

      let assessmentData = {
        ...formData,
        sectionId,
        courseId,
        isTimeBound: formData.isTimeBound,
        timeAllowed: formData.timeAllowed,
        content: { ...formData.content }
      }

      // Handle file uploads for FILE type assessment
      if (formData.assessmentType === 'FILE') {
        if (formData.content.assessmentFile) {
          const assessmentFileName = await handleFileUpload(formData.content.assessmentFile)
          assessmentData.content.assessmentFile = assessmentFileName
        }
        
        if (formData.content.supportingFile) {
          const supportingFileName = await handleFileUpload(formData.content.supportingFile)
          assessmentData.content.supportingFile = supportingFileName
        }
      }

      // Handle MCQ audio file uploads
      if (formData.assessmentType === 'MCQ') {
        const mcqsWithAudio = await Promise.all(
          formData.content.mcqs.map(async (mcq, index) => {
            if (mcq.audioFile) {
              const audioFormData = new FormData()
              audioFormData.append('file', mcq.audioFile)
              
              const response = await postData('upload/file?type=ASSESSMENT', audioFormData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              
              if (response.data && response.data.fileName) {
                return {
                  ...mcq,
                  audioFile: response.data.fileName
                }
              }
            }
            return mcq
          })
        )
        
        assessmentData.content.mcqs = mcqsWithAudio
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
    if (!sectionId || !formData.assessmentType || !formData.totalMarks || !formData.percentage || !formData.interval) {
      alert('Please fill all required fields')
      return false
    }

    if (Number(formData.interval) <= 0) {
      alert('Interval must be greater than 0')
      return false
    }

    if (Number(formData.percentage) > remainingPercentage) {
      alert(`Percentage cannot exceed ${remainingPercentage}%`)
      return false
    }

    if (formData.assessmentType === 'MCQ' && formData.isTimeBound) {
      if (!formData.timeAllowed || formData.timeAllowed <= 0) {
        alert('Please enter a valid time duration for time-bound assessment')
        return false
      }
    }

    return true
  }

  const resetForm = () => {
    setFormData({
      assessmentType: '',
      totalMarks: '',
      percentage: '',
      interval: '',
      isTimeBound: false,
      timeAllowed: '',
      assessor: null,
      moderator: null,
      verifier: null,
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

      {renderRoleSelections()}

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
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Interval (days)"
          value={formData.interval}
          onChange={e => handleFormChange('interval', e.target.value)}
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

      {renderTimeOptions()}

      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
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