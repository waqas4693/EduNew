import { useState, useEffect, useRef } from 'react'
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
  Backdrop,
  LinearProgress
} from '@mui/material'
import { postData, getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'

const RESOURCE_TYPES = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'PPT', label: 'PPT Slides' },
  { value: 'TEXT', label: 'Text with Questions' }
]

const AddResource = () => {
  const [formData, setFormData] = useState({
    name: '',
    resourceType: '',
    content: {
      text: '',
      questions: [
        { question: '', answer: '' },
        { question: '', answer: '' },
        { question: '', answer: '' }
      ],
      backgroundImage: '',
      previewImage: '',
      file: null
    }
  })
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  const renderResourceTypeFields = () => {
    switch (formData.resourceType) {
      case 'AUDIO':
        return (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Upload Audio File
              </Typography>
              <Button variant='outlined' component='label' fullWidth>
                {formData.content.file
                  ? formData.content.file.name
                  : 'Choose Audio File'}
                <input
                  type='file'
                  hidden
                  accept='audio/*'
                  onChange={e =>
                    handleFormChange('content', {
                      ...formData.content,
                      file: e.target.files[0]
                    })
                  }
                />
              </Button>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Upload Background Image
              </Typography>
              <Button variant='outlined' component='label' fullWidth>
                {formData.content.backgroundImage
                  ? formData.content.backgroundImage.name
                  : 'Choose Background Image'}
                <input
                  type='file'
                  hidden
                  accept='image/*'
                  onChange={e =>
                    handleFormChange('content', {
                      ...formData.content,
                      backgroundImage: e.target.files[0]
                    })
                  }
                />
              </Button>
            </Box>
          </>
        )

      case 'PPT':
        return (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Upload PPT File
              </Typography>
              <Button variant='outlined' component='label' fullWidth>
                {formData.content.file
                  ? formData.content.file.name
                  : 'Choose PPT File'}
                <input
                  type='file'
                  hidden
                  accept='.ppt,.pptx'
                  onChange={e =>
                    handleFormChange('content', {
                      ...formData.content,
                      file: e.target.files[0]
                    })
                  }
                />
              </Button>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Upload Preview Image
              </Typography>
              <Button variant='outlined' component='label' fullWidth>
                {formData.content.previewImage
                  ? formData.content.previewImage.name
                  : 'Choose Preview Image'}
                <input
                  type='file'
                  hidden
                  accept='image/*'
                  onChange={e =>
                    handleFormChange('content', {
                      ...formData.content,
                      previewImage: e.target.files[0]
                    })
                  }
                />
              </Button>
            </Box>
          </>
        )

      case 'VIDEO':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' sx={{ mb: 1 }}>
              Upload Video File
            </Typography>
            <Button variant='outlined' component='label' fullWidth>
              {formData.content.file
                ? formData.content.file.name
                : 'Choose Video File'}
              <input
                type='file'
                hidden
                accept='video/*'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    file: e.target.files[0]
                  })
                }
              />
            </Button>
          </Box>
        )

      case 'IMAGE':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' sx={{ mb: 1 }}>
              Upload Image File
            </Typography>
            <Button variant='outlined' component='label' fullWidth>
              {formData.content.file
                ? formData.content.file.name
                : 'Choose Image File'}
              <input
                type='file'
                hidden
                accept='image/*'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    file: e.target.files[0]
                  })
                }
              />
            </Button>
          </Box>
        )

      case 'PDF':
        return (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' sx={{ mb: 1 }}>
              Upload PDF File
            </Typography>
            <Button variant='outlined' component='label' fullWidth>
              {formData.content.file
                ? formData.content.file.name
                : 'Choose PDF File'}
              <input
                type='file'
                hidden
                accept='.pdf'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    file: e.target.files[0]
                  })
                }
              />
            </Button>
          </Box>
        )

      case 'TEXT':
        return (
          <>
            <TextField
              fullWidth
              multiline
              rows={4}
              label='Main Text'
              value={formData.content.text}
              onChange={e =>
                handleFormChange('content', {
                  ...formData.content,
                  text: e.target.value
                })
              }
              sx={{ mb: 3 }}
            />
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Upload Image
              </Typography>
              <Button variant='outlined' component='label' fullWidth>
                {formData.content.file
                  ? formData.content.file.name
                  : 'Choose Image File'}
                <input
                  type='file'
                  hidden
                  accept='image/*'
                  onChange={e =>
                    handleFormChange('content', {
                      ...formData.content,
                      file: e.target.files[0]
                    })
                  }
                />
              </Button>
            </Box>
            {formData.content.questions.map((q, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={`Question ${index + 1}`}
                  value={q.question}
                  onChange={e =>
                    handleQuestionChange(index, 'question', e.target.value)
                  }
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label={`Answer ${index + 1}`}
                  value={q.answer}
                  onChange={e =>
                    handleQuestionChange(index, 'answer', e.target.value)
                  }
                />
              </Box>
            ))}
          </>
        )

      default:
        return null
    }
  }

  const uploadFileToS3 = async (file) => {
    try {
      const { data: { signedUrl } } = await axios.post(url + 's3', {
        fileName: file.name,
        fileType: file.type
      })

      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })

      return file.name
    } catch (error) {
      console.error('Error uploading to S3:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUploading(true)

    console.log('Submitting Correctly')
    console.log(formData)
    
    try {
      if (!formData.name || !formData.resourceType || !sectionId) {
        alert('Please fill all required fields')
        return
      }

      console.log('formData')
      console.log(formData)

      const resourceData = {
        name: formData.name,
        resourceType: formData.resourceType,
        sectionId: sectionId
      }

      console.log('resourceData')
      console.log(resourceData)

      if (formData.resourceType === 'TEXT') {
        const contentData = {
          text: formData.content.text,
          questions: formData.content.questions
        }
        
        if (formData.content.file) {
          const fileName = await uploadFileToS3(formData.content.file)
          contentData.imageUrl = fileName
        }
        
        resourceData.content = contentData
      } else {
        const contentData = {}
        
        if (formData.content.file) {
          const fileName = await uploadFileToS3(formData.content.file)
          contentData.fileUrl = fileName
        }

        if (formData.resourceType === 'AUDIO' && formData.content.backgroundImage) {
          const bgImageName = await uploadFileToS3(formData.content.backgroundImage)
          contentData.backgroundImageUrl = bgImageName
        }

        if (formData.resourceType === 'PPT' && formData.content.previewImage) {
          const previewImageName = await uploadFileToS3(formData.content.previewImage)
          contentData.previewImageUrl = previewImageName
        }
        
        resourceData.content = contentData
      }

      console.log('resourceData')
      console.log(resourceData)

      const response = await postData('resources', resourceData)
      
      if (response.status === 201) {
        setFormData({
          name: '',
          resourceType: '',
          content: {
            text: '',
            questions: [
              { question: '', answer: '' },
              { question: '', answer: '' },
              { question: '', answer: '' }
            ],
            backgroundImage: '',
            previewImage: '',
            file: null
          }
        })
        setSectionId(null)
        setUnitId(null)
        setCourseId(null)
        alert('Resource added successfully')
      }
    } catch (error) {
      console.error('Error adding resource:', error)
      alert('Error uploading resource. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
        <Typography variant='h5' sx={{ mb: 3 }}>
          Add New Resource
        </Typography>
        <form onSubmit={handleSubmit}>
          <Autocomplete
            options={courses}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setCourseId(newValue?._id)}
            renderInput={params => (
              <TextField
                {...params}
                label='Select Course'
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          <Autocomplete
            options={units}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setUnitId(newValue?._id)}
            disabled={!courseId}
            renderInput={params => (
              <TextField
                {...params}
                label='Select Unit'
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          <Autocomplete
            options={sections}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setSectionId(newValue?._id)}
            disabled={!unitId}
            renderInput={params => (
              <TextField
                {...params}
                label='Select Section'
                required
                sx={{ mb: 3 }}
              />
            )}
          />
          <TextField
            fullWidth
            label='Resource Name'
            value={formData.name}
            onChange={e => handleFormChange('name', e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Resource Type</InputLabel>
            <Select
              value={formData.resourceType}
              onChange={e => handleFormChange('resourceType', e.target.value)}
              required
            >
              {RESOURCE_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {renderResourceTypeFields()}

          <Button type='submit' variant='contained' fullWidth>
            Add Resource
          </Button>
        </form>
      </Paper>
      
      {isUploading && (
        <Backdrop
          open={isUploading}
          sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        >
          <Box sx={{ width: '50%' }}>
            <Typography variant="h6" color="inherit" align="center">
              Uploading...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ height: '10px' }}
            />
          </Box>
        </Backdrop>
      )}
    </Box>
  )
}

export default AddResource
