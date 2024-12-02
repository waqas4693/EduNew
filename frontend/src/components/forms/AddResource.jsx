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

    // Submit updatedResources to the backend
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
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ my: 4 }} />
              </>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                size='small'
                label='Resource Name'
                value={resource.name}
                onChange={e => handleFormChange(index, 'name', e.target.value)}
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
              <FormControl fullWidth size='small'>
                <InputLabel
                  sx={{
                    color: '#8F8F8F',
                    backgroundColor: 'white',
                    padding: '0 4px'
                  }}
                >
                  Resource Type
                </InputLabel>
                <Select
                  value={resource.resourceType}
                  onChange={e => handleFormChange(index, 'resourceType', e.target.value)}
                  required
                  sx={{
                    borderRadius: '8px',
                    border: '1px solid #20202033',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                >
                  {RESOURCE_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <UploadButton
                label='Choose Thumbnail'
                value={resource.content.thumbnail}
                accept='image/*'
                onChange={e =>
                  handleContentChange(index, 'thumbnail', e.target.files[0])
                }
              />

              {resource.resourceType === 'MCQ' && (
                <UploadButton
                  label='Choose Question Image'
                  value={resource.content.mcq?.imageFile}
                  accept='image/*'
                  onChange={e =>
                    handleContentChange(index, 'mcq', {
                      ...resource.content.mcq,
                      imageFile: e.target.files[0]
                    })
                  }
                />
              )}

              {resource.resourceType === 'VIDEO' && (
                <UploadButton
                  label='Choose Video'
                  value={resource.content.file}
                  accept='video/*'
                  onChange={e =>
                    handleContentChange(index, 'file', e.target.files[0])
                  }
                />
              )}

              {resource.resourceType === 'AUDIO' && (
                <>
                  <UploadButton
                    label='Choose Audio'
                    value={resource.content.file}
                    accept='audio/*'
                    onChange={e =>
                      handleContentChange(index, 'file', e.target.files[0])
                    }
                  />
                  <UploadButton
                    label='Choose Background'
                    value={resource.content.backgroundImage}
                    accept='image/*'
                    onChange={e =>
                      handleContentChange(index, 'backgroundImage', e.target.files[0])
                    }
                  />
                </>
              )}

              {resource.resourceType === 'PPT' && (
                <>
                  <UploadButton
                    label='Choose PPT'
                    value={resource.content.file}
                    accept='.ppt,.pptx'
                    onChange={e =>
                      handleContentChange(index, 'file', e.target.files[0])
                    }
                  />
                  <UploadButton
                    label='Choose Preview'
                    value={resource.content.previewImage}
                    accept='image/*'
                    onChange={e =>
                      handleContentChange(index, 'previewImage', e.target.files[0])
                    }
                  />
                </>
              )}

              {resource.resourceType === 'PDF' && (
                <UploadButton
                  label='Choose PDF'
                  value={resource.content.file}
                  accept='.pdf'
                  onChange={e =>
                    handleContentChange(index, 'file', e.target.files[0])
                  }
                />
              )}

              {resource.resourceType === 'IMAGE' && (
                <UploadButton
                  label='Choose Image'
                  value={resource.content.file}
                  accept='image/*'
                  onChange={e =>
                    handleContentChange(index, 'file', e.target.files[0])
                  }
                />
              )}

              {resource.resourceType === 'TEXT' && (
                <UploadButton
                  label='Choose Background'
                  value={resource.content.backgroundImage}
                  accept='image/*'
                  onChange={e =>
                    handleContentChange(index, 'backgroundImage', e.target.files[0])
                  }
                />
              )}
            </Box>

            {resource.resourceType === 'TEXT' && (
              <>
                {resource.content.questions.map((q, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      size='small'
                      label={`Question ${index + 1}`}
                      value={q.question}
                      onChange={e =>
                        handleContentChange(index, 'questions', {
                          ...q,
                          question: e.target.value
                        })
                      }
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
                      size='small'
                      label={`Answer ${index + 1}`}
                      value={q.answer}
                      onChange={e =>
                        handleContentChange(index, 'questions', {
                          ...q,
                          answer: e.target.value
                        })
                      }
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
                ))}
              </>
            )}

            {resource.resourceType === 'MCQ' && (
              <>
                <TextField
                  fullWidth
                  size='small'
                  label='Question'
                  value={resource.content.mcq?.question || ''}
                  onChange={e =>
                    handleContentChange(index, 'mcq', {
                      ...resource.content.mcq,
                      question: e.target.value
                    })
                  }
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

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel
                      sx={{
                        color: '#8F8F8F',
                        backgroundColor: 'white',
                        padding: '0 4px'
                      }}
                    >
                      Number of Options
                    </InputLabel>
                    <Select
                      value={resource.content.mcq?.options?.length || 4}
                      onChange={e => {
                        const numOptions = e.target.value
                        const currentOptions = resource.content.mcq?.options || []
                        const newOptions = Array(numOptions).fill('').map((_, i) => currentOptions[i] || '')
                        handleContentChange(index, 'mcq', {
                          ...resource.content.mcq,
                          options: newOptions
                        })
                      }}
                      sx={{
                        borderRadius: '8px',
                        border: '1px solid #20202033',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value={4}>4 Options</MenuItem>
                      <MenuItem value={5}>5 Options</MenuItem>
                      <MenuItem value={6}>6 Options</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                  {chunk(resource.content.mcq?.options || [], 2).map((optionPair, pairIndex) => (
                    <Box key={pairIndex} sx={{ display: 'flex', gap: 2 }}>
                      {optionPair.map((option, optionIndex) => (
                        <TextField
                          key={pairIndex * 2 + optionIndex}
                          fullWidth
                          size='small'
                          label={`Option ${pairIndex * 2 + optionIndex + 1}`}
                          value={option}
                          onChange={e => {
                            const newOptions = [...(resource.content.mcq?.options || [])]
                            newOptions[pairIndex * 2 + optionIndex] = e.target.value
                            handleContentChange(index, 'mcq', {
                              ...resource.content.mcq,
                              options: newOptions
                            })
                          }}
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
                      ))}
                    </Box>
                  ))}
                </Box>

                <FormControl fullWidth size='small' sx={{ mb: 2 }}>
                  <InputLabel
                    sx={{
                      color: '#8F8F8F',
                      backgroundColor: 'white',
                      padding: '0 4px'
                    }}
                  >
                    Correct Answer
                  </InputLabel>
                  <Select
                    value={resource.content.mcq?.correctAnswer || ''}
                    onChange={e =>
                      handleContentChange(index, 'mcq', {
                        ...resource.content.mcq,
                        correctAnswer: e.target.value
                      })
                    }
                    required
                    sx={{
                      borderRadius: '8px',
                      border: '1px solid #20202033',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      }
                    }}
                  >
                    {resource.content.mcq?.options?.map((option, optIndex) => (
                      <MenuItem key={optIndex} value={option}>
                        Option {optIndex + 1}: {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <TextField
              fullWidth
              size='small'
              label='External Link (Optional)'
              value={resource.content.externalLink}
              onChange={e =>
                handleContentChange(index, 'externalLink', e.target.value)
              }
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
          </Box>
        ))}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={addNewResource}
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
              Add Resource
            </Typography>
          </Box>
          <Button
            type='submit'
            variant='contained'
            sx={{
              minWidth: '100px',
              width: '100px',
              borderRadius: '8px',
              height: '36px'
            }}
          >
            Save All
          </Button>
        </Box>
      </form>

      {isUploading && (
        <Backdrop
          open={isUploading}
          sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        >
          <Box sx={{ width: '50%' }}>
            <Typography variant='h6' color='inherit' align='center'>
              Uploading...
            </Typography>
            <LinearProgress
              variant='determinate'
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
