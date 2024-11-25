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
  IconButton
} from '@mui/material'
import { postData, getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'
import AddIcon from '@mui/icons-material/Add'

const RESOURCE_TYPES = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'PPT', label: 'PPT Slides' },
  { value: 'TEXT', label: 'Text with Questions' }
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
      file: null,
      thumbnail: null,
      externalLink: ''
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

  const renderCommonFields = () => (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1 }}>
          Upload Thumbnail
        </Typography>
        <Button variant='outlined' component='label' fullWidth>
          {formData.content.thumbnail
            ? formData.content.thumbnail.name
            : 'Choose Thumbnail Image'}
          <input
            type='file'
            hidden
            accept='image/*'
            onChange={e =>
              handleFormChange('content', {
                ...formData.content,
                thumbnail: e.target.files[0]
              })
            }
          />
        </Button>
      </Box>
      <TextField
        fullWidth
        label='External Link (Optional)'
        value={formData.content.externalLink}
        onChange={e =>
          handleFormChange('content', {
            ...formData.content,
            externalLink: e.target.value
          })
        }
        sx={{ mb: 3 }}
      />
    </>
  )

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
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <UploadButton
                label='Choose Thumbnail'
                value={formData.content.thumbnail}
                accept='image/*'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    thumbnail: e.target.files[0]
                  })
                }
              />

              {formData.resourceType === 'TEXT' && (
                <UploadButton
                  label='Choose Background'
                  value={formData.content.backgroundImage}
                  accept='image/*'
                  onChange={e =>
                    handleFormChange('content', {
                      ...formData.content,
                      backgroundImage: e.target.files[0]
                    })
                  }
                />
              )}
            </Box>
            {formData.content.questions.map((q, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  label={`Question ${index + 1}`}
                  value={q.question}
                  onChange={e =>
                    handleQuestionChange(index, 'question', e.target.value)
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
                    handleQuestionChange(index, 'answer', e.target.value)
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
        )

      default:
        return null
    }
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

  const handleSubmit = async e => {
    e.preventDefault()
    setIsUploading(true)

    try {
      if (!formData.name || !formData.resourceType || !sectionId) {
        alert('Please fill all required fields')
        return
      }

      const resourceData = {
        resourceType: formData.resourceType,
        sectionId: sectionId
      }

      const contentData = {}

      if (formData.content.file) {
        const fileName = await uploadFileToS3(
          formData.content.file,
          formData.name
        )
        resourceData.name = fileName
      }

      if (
        formData.resourceType === 'AUDIO' &&
        formData.content.backgroundImage
      ) {
        const bgFileName = await uploadFileToS3(
          formData.content.backgroundImage,
          `${formData.name}_bg`
        )
        contentData.backgroundImageUrl = bgFileName
      }

      if (formData.resourceType === 'PPT' && formData.content.previewImage) {
        const previewFileName = await uploadFileToS3(
          formData.content.previewImage,
          `${formData.name}_preview`
        )
        contentData.previewImageUrl = previewFileName
      }

      if (formData.content.thumbnail) {
        const thumbnailFileName = await uploadFileToS3(
          formData.content.thumbnail,
          `${formData.name}_thumb`
        )
        contentData.thumbnailUrl = thumbnailFileName
      }

      if (formData.content.externalLink) {
        contentData.externalLink = formData.content.externalLink
      }

      resourceData.content = {
        ...resourceData.content,
        ...contentData
      }

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
            file: null,
            thumbnail: null,
            externalLink: ''
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

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='Resource Name'
            value={formData.name}
            onChange={e => handleFormChange('name', e.target.value)}
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
              value={formData.resourceType}
              onChange={e => handleFormChange('resourceType', e.target.value)}
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
            value={formData.content.thumbnail}
            accept='image/*'
            onChange={e =>
              handleFormChange('content', {
                ...formData.content,
                thumbnail: e.target.files[0]
              })
            }
          />

          {formData.resourceType === 'VIDEO' && (
            <UploadButton
              label='Choose Video'
              value={formData.content.file}
              accept='video/*'
              onChange={e =>
                handleFormChange('content', {
                  ...formData.content,
                  file: e.target.files[0]
                })
              }
            />
          )}

          {formData.resourceType === 'AUDIO' && (
            <>
              <UploadButton
                label='Choose Audio'
                value={formData.content.file}
                accept='audio/*'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    file: e.target.files[0]
                  })
                }
              />
              <UploadButton
                label='Choose Background'
                value={formData.content.backgroundImage}
                accept='image/*'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    backgroundImage: e.target.files[0]
                  })
                }
              />
            </>
          )}

          {formData.resourceType === 'PPT' && (
            <>
              <UploadButton
                label='Choose PPT'
                value={formData.content.file}
                accept='.ppt,.pptx'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    file: e.target.files[0]
                  })
                }
              />
              <UploadButton
                label='Choose Preview'
                value={formData.content.previewImage}
                accept='image/*'
                onChange={e =>
                  handleFormChange('content', {
                    ...formData.content,
                    previewImage: e.target.files[0]
                  })
                }
              />
            </>
          )}

          {formData.resourceType === 'PDF' && (
            <UploadButton
              label='Choose PDF'
              value={formData.content.file}
              accept='.pdf'
              onChange={e =>
                handleFormChange('content', {
                  ...formData.content,
                  file: e.target.files[0]
                })
              }
            />
          )}

          {formData.resourceType === 'IMAGE' && (
            <UploadButton
              label='Choose Image'
              value={formData.content.file}
              accept='image/*'
              onChange={e =>
                handleFormChange('content', {
                  ...formData.content,
                  file: e.target.files[0]
                })
              }
            />
          )}

          {formData.resourceType === 'TEXT' && (
            <UploadButton
              label='Choose Background'
              value={formData.content.backgroundImage}
              accept='image/*'
              onChange={e =>
                handleFormChange('content', {
                  ...formData.content,
                  backgroundImage: e.target.files[0]
                })
              }
            />
          )}
        </Box>

        {formData.resourceType === 'TEXT' && (
          <>
            {formData.content.questions.map((q, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  label={`Question ${index + 1}`}
                  value={q.question}
                  onChange={e =>
                    handleQuestionChange(index, 'question', e.target.value)
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
                    handleQuestionChange(index, 'answer', e.target.value)
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

        <TextField
          fullWidth
          size='small'
          label='External Link (Optional)'
          value={formData.content.externalLink}
          onChange={e =>
            handleFormChange('content', {
              ...formData.content,
              externalLink: e.target.value
            })
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

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            Save
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
