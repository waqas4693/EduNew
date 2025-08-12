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
  Switch,
  OutlinedInput
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
    assessmentType: 'MCQ',
    title: '',
    description: '',
    totalMarks: '',
    percentage: '',
    interval: '',
    isTimeBound: false,
    timeAllowed: '',
    content: {
      mcqs: [],
      questions: [],
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
  const [mcqOptionCounts, setMcqOptionCounts] = useState({}) // Track option counts for each MCQ
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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

  // Initialize MCQ option counts when MCQs change
  useEffect(() => {
    if (formData.content?.mcqs) {
      const counts = {}
      formData.content.mcqs.forEach((mcq, index) => {
        counts[index] = mcq.options?.length || 2
      })
      console.log('Initializing MCQ option counts:', counts)
      setMcqOptionCounts(counts)
    }
  }, [formData.content?.mcqs])

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
    const newMCQ = {
      question: '',
      options: ['', ''],
      numberOfCorrectAnswers: 1,
      correctAnswers: [],
      imageFile: null,
      audioFile: null
    }
    
    const newIndex = formData.content?.mcqs?.length || 0
    console.log('Adding MCQ at index:', newIndex)
    
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        mcqs: [...(prev.content?.mcqs || []), newMCQ]
      }
    }))
    
    setMcqOptionCounts(prev => {
      const newCounts = {
        ...prev,
        [newIndex]: 2
      }
      console.log('Updated MCQ option counts:', newCounts)
      return newCounts
    })
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

  const handleMCQChange = (index, field, value) => {
    setFormData(prev => {
      const updatedMcqs = [...(prev.content?.mcqs || [])]
      
      if (field === 'numberOfCorrectAnswers') {
        // Update numberOfCorrectAnswers
        updatedMcqs[index] = {
          ...updatedMcqs[index],
          numberOfCorrectAnswers: value,
          // Adjust correctAnswers array if needed
          correctAnswers: updatedMcqs[index].correctAnswers?.slice(0, value) || []
        }
      } else if (field === 'correctAnswers') {
        // Handle correctAnswers array
        let newCorrectAnswers
        if (Array.isArray(value)) {
          newCorrectAnswers = value
        } else {
          // If it's a single value, convert to array
          newCorrectAnswers = [value]
        }
        
        updatedMcqs[index] = {
          ...updatedMcqs[index],
          correctAnswers: newCorrectAnswers
        }
      } else if (field === 'options') {
        // Handle options array
        updatedMcqs[index] = {
          ...updatedMcqs[index],
          options: value
        }
      } else {
        // Handle other fields
        updatedMcqs[index] = {
          ...updatedMcqs[index],
          [field]: value
        }
      }
      
      return {
        ...prev,
        content: {
          ...prev.content,
          mcqs: updatedMcqs
        }
      }
    })
  }

  const handleMCQOptionChange = (mcqIndex, optionIndex, value) => {
    setFormData(prev => {
      const updatedMcqs = [...(prev.content?.mcqs || [])]
      const currentOptions = [...(updatedMcqs[mcqIndex]?.options || [])]
      currentOptions[optionIndex] = value
      
      updatedMcqs[mcqIndex] = {
        ...updatedMcqs[mcqIndex],
        options: currentOptions
      }
      
      return {
        ...prev,
        content: {
          ...prev.content,
          mcqs: updatedMcqs
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

  const handleMCQImageChange = (index, file) => {
    setFormData(prev => {
      const newMCQs = [...prev.content.mcqs]
      newMCQs[index] = {
        ...newMCQs[index],
        imageFile: file
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

  const addMCQOption = (mcqIndex) => {
    console.log('Adding option for MCQ index:', mcqIndex)
    setFormData(prev => {
      const updatedMcqs = [...(prev.content?.mcqs || [])]
      const currentOptions = updatedMcqs[mcqIndex]?.options || []
      
      if (currentOptions.length < 6) {
        updatedMcqs[mcqIndex] = {
          ...updatedMcqs[mcqIndex],
          options: [...currentOptions, '']
        }
        
        // Update option count
        setMcqOptionCounts(prevCounts => {
          const newCounts = {
            ...prevCounts,
            [mcqIndex]: currentOptions.length + 1
          }
          console.log('Updated option counts after adding:', newCounts)
          return newCounts
        })
      }
      
      return {
        ...prev,
        content: {
          ...prev.content,
          mcqs: updatedMcqs
        }
      }
    })
  }

  const removeMCQOption = (mcqIndex, optionIndex) => {
    console.log('Removing option for MCQ index:', mcqIndex, 'option index:', optionIndex)
    setFormData(prev => {
      const updatedMcqs = [...(prev.content?.mcqs || [])]
      const currentOptions = updatedMcqs[mcqIndex]?.options || []
      
      if (currentOptions.length > 2) {
        const newOptions = currentOptions.filter((_, index) => index !== optionIndex)
        updatedMcqs[mcqIndex] = {
          ...updatedMcqs[mcqIndex],
          options: newOptions
        }
        
        // Update option count
        setMcqOptionCounts(prevCounts => {
          const newCounts = {
            ...prevCounts,
            [mcqIndex]: newOptions.length
          }
          console.log('Updated option counts after removing:', newCounts)
          return newCounts
        })
        
        // Adjust correctAnswers if needed
        const currentCorrectAnswers = updatedMcqs[mcqIndex].correctAnswers || []
        const removedOption = currentOptions[optionIndex]
        if (currentCorrectAnswers.includes(removedOption)) {
          updatedMcqs[mcqIndex].correctAnswers = currentCorrectAnswers.filter(
            answer => answer !== removedOption
          )
        }
      }
      
      return {
        ...prev,
        content: {
          ...prev.content,
          mcqs: updatedMcqs
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
            {formData.content.mcqs.map((mcq, index) => {
              console.log(`Rendering MCQ ${index}, mcqOptionCounts:`, mcqOptionCounts)
              return (
                <Box key={index} sx={{ border: '1px solid #ddd', p: 2, mb: 2, borderRadius: 1 }}>
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
                        {mcq.imageFile ? truncateFileName(mcq.imageFile.name) : 'Add Image'}
                      </Typography>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={e => handleMCQImageChange(index, e.target.files[0])}
                      />
                    </Button>
                  </Box>

                  {/* MCQ Options */}
                  {mcq.options.map((option, optionIndex) => {
                    console.log(`Rendering MCQ ${index}, option ${optionIndex}, mcqOptionCounts[${index}]:`, mcqOptionCounts[index])
                    return (
                      <Box key={optionIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          label={`Option ${optionIndex + 1}`}
                          value={option}
                          onChange={e => handleMCQOptionChange(index, optionIndex, e.target.value)}
                          sx={{
                            flex: 1,
                            '& .MuiInputBase-root': {
                              height: '40px'
                            }
                          }}
                        />
                        {(() => {
                          console.log(`Remove option button for MCQ ${index}, option ${optionIndex}, mcqOptionCounts[${index}]:`, mcqOptionCounts[index])
                          return mcqOptionCounts[index] > 2 && (
                            <IconButton
                              onClick={() => removeMCQOption(index, optionIndex)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )
                        })()}
                      </Box>
                    )
                  })}
                  
                  {/* Add Option Button */}
                  {(() => {
                    console.log(`Add option button for MCQ ${index}, mcqOptionCounts[${index}]:`, mcqOptionCounts[index])
                    return mcqOptionCounts[index] < 6 && (
                      <Button
                        onClick={() => addMCQOption(index)}
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    )
                  })()}
                  
                  {/* Number of Correct Answers */}
                  <TextField
                    label="Number of Correct Answers"
                    type="number"
                    value={mcq.numberOfCorrectAnswers}
                    onChange={e => handleMCQChange(index, 'numberOfCorrectAnswers', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 6 }}
                    sx={{ mt: 2, width: '200px' }}
                  />
                  
                  {/* Correct Answers Selection */}
                  <FormControl sx={{ mt: 2, minWidth: '300px' }}>
                    <InputLabel>Correct Answers</InputLabel>
                    <Select
                      multiple
                      value={mcq.correctAnswers || []}
                      onChange={e => handleMCQChange(index, 'correctAnswers', e.target.value)}
                      input={<OutlinedInput label="Correct Answers" />}
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {mcq.options.map((option, optIndex) => (
                        <MenuItem key={optIndex} value={option}>
                          {option || `Option ${optIndex + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {mcq.audioFile && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'success.main' }}>
                      Audio file uploaded: {mcq.audioFile.name}
                    </Typography>
                  )}

                  {mcq.imageFile && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'success.main' }}>
                      Image file uploaded: {mcq.imageFile.name}
                    </Typography>
                  )}

                  <IconButton onClick={() => removeMCQ(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            })}
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
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare the assessment data
      const assessmentData = { 
        ...formData,
        sectionId,
        courseId,
        unitId
      }
      
      // Handle MCQ file uploads if present
      if (formData.assessmentType === 'MCQ' && formData.content?.mcqs) {
        const mcqsWithFiles = await Promise.all(
          formData.content.mcqs.map(async (mcq, index) => {
            const updatedMcq = { ...mcq }
            
            // Handle MCQ image upload
            if (mcq.imageFile && mcq.imageFile instanceof File) {
              const formData = new FormData()
              formData.append('file', mcq.imageFile)
              
              try {
                const uploadResponse = await axios.post(
                  `${url}upload/file?type=MCQ_IMAGE`,
                  formData,
                  {
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    }
                  }
                )
                updatedMcq.imageFile = uploadResponse.data.fileName
              } catch (error) {
                console.error('Error uploading MCQ image:', error)
                throw new Error(`Failed to upload image for MCQ ${index + 1}`)
              }
            }
            
            // Handle MCQ audio upload
            if (mcq.audioFile && mcq.audioFile instanceof File) {
              const formData = new FormData()
              formData.append('file', mcq.audioFile)
              
              try {
                const uploadResponse = await axios.post(
                  `${url}upload/file?type=MCQ_AUDIO`,
                  formData,
                  {
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    }
                  }
                )
                updatedMcq.audioFile = uploadResponse.data.fileName
              } catch (error) {
                console.error('Error uploading MCQ audio:', error)
                throw new Error(`Failed to upload audio for MCQ ${index + 1}`)
              }
            }
            
            return updatedMcq
          })
        )
        
        assessmentData.content.mcqs = mcqsWithFiles
      }
      
      // Submit the assessment
      const response = await axios.post(`${url}assessments`, assessmentData)
      
      if (response.status === 201) {
        // Show success message
        setSuccessMessage('Assessment created successfully!')
        
        // Reset form after successful submission
        setTimeout(() => {
          resetForm()
          setSuccessMessage('')
        }, 2000)
      }
    } catch (error) {
      console.error('Error creating assessment:', error)
      setErrorMessage(error.response?.data?.message || error.message || 'Error creating assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateForm = () => {
    if (!sectionId || !formData.title || !formData.assessmentType || !formData.totalMarks || !formData.percentage || !formData.interval) {
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

    // Validate MCQ content
    if (formData.assessmentType === 'MCQ') {
      for (let i = 0; i < formData.content.mcqs.length; i++) {
        const mcq = formData.content.mcqs[i]
        
        if (!mcq.question.trim()) {
          alert(`Please enter a question for MCQ ${i + 1}`)
          return false
        }
        
        if (mcq.options.filter(opt => opt.trim()).length < 2) {
          alert(`MCQ ${i + 1} must have at least 2 options`)
          return false
        }
        
        if (mcq.correctAnswers.length === 0) {
          alert(`Please select correct answers for MCQ ${i + 1}`)
          return false
        }
        
        if (mcq.correctAnswers.length > mcq.numberOfCorrectAnswers) {
          alert(`MCQ ${i + 1} has more correct answers selected than allowed`)
          return false
        }
      }
    }

    return true
  }

  const resetForm = () => {
    setFormData({
      assessmentType: 'MCQ',
      title: '',
      description: '',
      totalMarks: '',
      percentage: '',
      interval: '',
      isTimeBound: false,
      timeAllowed: '',
      content: {
        questions: [],
        mcqs: [],
        assessmentFile: null,
        supportingFile: null
      }
    })
    setMcqOptionCounts({})
    setSuccessMessage('')
    setErrorMessage('')
    fetchExistingAssessments()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Add New Assessment
      </Typography>
      
      {/* Success Message */}
      {successMessage && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography color="success.contrastText">
            {successMessage}
          </Typography>
        </Box>
      )}
      
      {/* Error Message */}
      {errorMessage && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error.contrastText">
            {errorMessage}
          </Typography>
        </Box>
      )}
      
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

      {/* Title and Description Fields */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Assessment Title"
          value={formData.title}
          onChange={e => handleFormChange('title', e.target.value)}
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
          label="Description"
          value={formData.description}
          onChange={e => handleFormChange('description', e.target.value)}
          multiline
          rows={2}
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
          color="primary"
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? 'Creating Assessment...' : 'Create Assessment'}
        </Button>
      </Box>
    </form>
    </Box>
  )
}

export default AddAssessment 