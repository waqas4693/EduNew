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
  Backdrop,
  LinearProgress,
  IconButton,
  Divider
} from '@mui/material'
import { postData, getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

const RESOURCE_TYPES = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'PPT', label: 'PPT Slides' },
  { value: 'TEXT', label: 'Text with Questions' },
  { value: 'MCQ', label: 'Multiple Choice Question' }
]

const UploadButton = ({ label, onChange, value, accept }) => (
  <Button
    variant='outlined'
    component='label'
    fullWidth
    sx={{
      height: '36px',
      borderRadius: '8px',
      border: '1px solid #20202033'
    }}
  >
    {value ? value.name : label}
    <input type='file' hidden accept={accept} onChange={onChange} />
  </Button>
)

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  )

const AddResource = () => {
  const [resources, setResources] = useState([{
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
      file: null,
      thumbnail: null,
      externalLink: '',
      mcq: {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        imageFile: null
      }
    }
  }])
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

  const addNewResource = () => {
    setResources(prev => [...prev, {
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
        file: null,
        thumbnail: null,
        externalLink: '',
        mcq: {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          imageFile: null
        }
      }
    }])
  }

  const handleFormChange = (index, field, value) => {
    setResources(prev => {
      const newResources = [...prev]
      newResources[index] = {
        ...newResources[index],
        [field]: value
      }
      return newResources
    })
  }

  const handleContentChange = (index, field, value) => {
    setResources(prev => {
      const newResources = [...prev]
      newResources[index] = {
        ...newResources[index],
        content: {
          ...newResources[index].content,
          [field]: value
        }
      }
      return newResources
    })
  }

  const uploadFileToS3 = async (file, resourceName) => {
    try {
      const fileExtension = file.name.split('.').pop()
      const finalFileName = `${resourceName}.${fileExtension}`

      const {
        data: { signedUrl }
      } = await axios.post(url + 's3', {
        fileName: finalFileName,
        fileType: file.type
      })

      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(progress)
        }
      })

      return finalFileName
    } catch (error) {
      console.error('Error uploading to S3:', error)
      throw error
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsUploading(true)

    try {
      const updatedResources = await Promise.all(resources.map(async (resource) => {
        const contentData = { ...resource.content }

        if (resource.resourceType === 'MCQ' && resource.content.mcq?.imageFile) {
          const imageFileName = await uploadFileToS3(
            resource.content.mcq.imageFile,
            resource.name
          )
          contentData.mcq = {
            ...resource.content.mcq,
            imageUrl: imageFileName
          }
          delete contentData.mcq.imageFile
        }

        return {
          ...resource,
          content: contentData
        }
      }))

      // Use postData to send the updated resources to the backend
      const response = await postData('resources', { resources: updatedResources })
      if (response.status === 201) {
        console.log('Resources uploaded successfully:', response.data)
      }
    } catch (error) {
      console.error('Error uploading resources:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const removeResource = (indexToRemove) => {
    setResources(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Autocomplete
            fullWidth
            size='small'
            options={courses}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setCourseId(newValue?._id)}
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Select Course'
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
            size='small'
            options={units}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setUnitId(newValue?._id)}
            disabled={!courseId}
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Select Unit'
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
            size='small'
            options={sections}
            getOptionLabel={option => option.name}
            onChange={(_, newValue) => setSectionId(newValue?._id)}
            disabled={!unitId}
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Select Section'
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

        {resources.map((resource, index) => (
          <Box key={index}>
            {index > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <IconButton
                    onClick={() => removeResource(index)}
                    sx={{
                      color: 'error.main'
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </>
            )}
            <TextField
              fullWidth
              size='small'
              label='Resource Name'
              value={resource.name}
              onChange={(e) => handleFormChange(index, 'name', e.target.value)}
              required
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
            <FormControl fullWidth size='small' sx={{ mb: 2 }}>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={resource.resourceType}
                onChange={(e) => handleFormChange(index, 'resourceType', e.target.value)}
                label='Resource Type'
                required
                sx={{
                  borderRadius: '8px',
                  border: '1px solid #20202033',
                  '& fieldset': {
                    border: 'none'
                  }
                }}
              >
                {RESOURCE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Add more fields as needed */}
          </Box>
        ))}

        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={addNewResource}
          sx={{
            mb: 2,
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          Add Resource
        </Button>

        <Button
          type='submit'
          variant='contained'
          color='primary'
          disabled={isUploading}
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          {isUploading ? 'Uploading...' : 'Submit'}
        </Button>

        {isUploading && (
          <Backdrop open={isUploading} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <LinearProgress variant='determinate' value={uploadProgress} sx={{ width: '100%' }} />
          </Backdrop>
        )}
      </form>
    </Box>
  )
}

export default AddResource
