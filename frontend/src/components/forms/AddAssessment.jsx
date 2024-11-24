import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
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
        questions: [...prev.content.questions, { question: '', answer: '' }]
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

  const handleQuestionChange = (index, field, value) => {
    setFormData(prev => {
      const newQuestions = [...prev.content.questions]
      newQuestions[index] = {
        ...newQuestions[index],
        [field]: value
      }
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
              <Box key={index} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={`Question ${index + 1}`}
                  value={q.question}
                  onChange={e => handleQuestionChange(index, 'question', e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label={`Answer ${index + 1}`}
                  value={q.answer}
                  onChange={e => handleQuestionChange(index, 'answer', e.target.value)}
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
              <Box key={index} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={`Question ${index + 1}`}
                  value={mcq.question}
                  onChange={e => handleMCQChange(index, 'question', e.target.value)}
                  sx={{ mb: 1 }}
                />
                {mcq.options.map((option, optionIndex) => (
                  <TextField
                    key={optionIndex}
                    fullWidth
                    label={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={e => handleMCQChange(index, 'options', e.target.value, optionIndex)}
                    sx={{ mb: 1 }}
                  />
                ))}
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <InputLabel>Correct Answer</InputLabel>
                  <Select
                    value={mcq.correctAnswer}
                    onChange={e => handleMCQChange(index, 'correctAnswer', e.target.value)}
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
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Assessment File
              </Typography>
              <Button variant="outlined" component="label" fullWidth>
                {formData.content.assessmentFile
                  ? formData.content.assessmentFile.name
                  : 'Choose Assessment File'}
                <input
                  type="file"
                  hidden
                  onChange={e => handleFormChange('content', {
                    ...formData.content,
                    assessmentFile: e.target.files[0]
                  })}
                />
              </Button>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Supporting File (Optional)
              </Typography>
              <Button variant="outlined" component="label" fullWidth>
                {formData.content.supportingFile
                  ? formData.content.supportingFile.name
                  : 'Choose Supporting File'}
                <input
                  type="file"
                  hidden
                  onChange={e => handleFormChange('content', {
                    ...formData.content,
                    supportingFile: e.target.files[0]
                  })}
                />
              </Button>
            </Box>
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
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Add Assessment
        </Typography>
        <form onSubmit={handleSubmit}>
          <Autocomplete
            options={courses}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setCourseId(newValue?._id)}
            renderInput={params => (
              <TextField {...params} label="Select Course" required sx={{ mb: 3 }} />
            )}
          />

          <Autocomplete
            options={units}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setUnitId(newValue?._id)}
            disabled={!courseId}
            renderInput={params => (
              <TextField {...params} label="Select Unit" required sx={{ mb: 3 }} />
            )}
          />

          <Autocomplete
            options={sections}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setSectionId(newValue?._id)}
            disabled={!unitId}
            renderInput={params => (
              <TextField {...params} label="Select Section" required sx={{ mb: 3 }} />
            )}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Assessment Type</InputLabel>
            <Select
              value={formData.assessmentType}
              onChange={e => handleFormChange('assessmentType', e.target.value)}
              required
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
            type="number"
            label="Total Marks"
            value={formData.totalMarks}
            onChange={e => handleFormChange('totalMarks', e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            type="number"
            label={`Percentage (Remaining: ${remainingPercentage}%)`}
            value={formData.percentage}
            onChange={e => handleFormChange('percentage', e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          {renderAssessmentTypeFields()}

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
            Add Assessment
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default AddAssessment 