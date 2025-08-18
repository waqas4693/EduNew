import {
  Box,
  Alert,
  Button,
  Backdrop,
  TextField,
  Accordion,
  Typography,
  IconButton,
  Autocomplete,
  LinearProgress,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { getData } from '../../../api/api'
import axios from 'axios'
import url from '../../config/server-url'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MediaViewer from '../../MediaViewer'

// Import our new components and utilities
import FileUploader from './components/FileUploader'
import ExternalLinks from './components/ExternalLinks'
import MCQForm from './components/MCQForm'
import useResourceForm from './hooks/useResourceForm'
import {
  RESOURCE_TYPES,
  getFileAcceptTypes,
  getInitialResourceContent,
  validateResource,
  processResourceContent
} from './utils/resourceHelpers'

const AddResource = ({ courseId: propsCourseId, editMode }) => {
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSearchBackend, setShowSearchBackend] = useState(false)
  const [allResources, setAllResources] = useState([])
  const [mediaViewer, setMediaViewer] = useState({
    open: false,
    url: '',
    type: '',
    title: ''
  })

  // Use our custom hook for resource form management
  const {
    resources,
    setResources,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    error,
    setError,
    addResource,
    handleFormChange,
    handleContentChange,
    removeResource
  } = useResourceForm()

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        const response = await getData('courses')
        if (response.status === 200) {
          setCourses(response.data.data)
          if (editMode && propsCourseId) {
            const course = response.data.data.find(c => c._id === propsCourseId)
            if (course) {
              setSelectedCourse(course)
              setCourseId(propsCourseId)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }

    fetchCoursesData()
  }, [editMode, propsCourseId])

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
    if (sectionId && editMode) {
      fetchResources()
    }
  }, [sectionId, editMode])

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

  const fetchResources = async (page = 1, search = '') => {
    if (!sectionId) return

    setIsLoading(true)
    try {
      const response = await getData(`resources/${sectionId}?page=${page}&limit=15&search=${search}`)
      if (response.status === 200) {
        const formattedResources = await Promise.all(response.data.resources.map(async resource => {
          const content = { ...resource.content }

          if (content.fileName) {
            const fileResponse = await axios.get(`${url}resources/files/url/${resource.resourceType}/${content.fileName}`)
            content.fileUrl = fileResponse.data.signedUrl
          }
          if (content.backgroundImage) {
            const bgResponse = await axios.get(`${url}resources/files/url/BACKGROUNDS/${content.backgroundImage}`)
            content.backgroundImageUrl = bgResponse.data.signedUrl
          }
          if (content.mcq?.imageFile) {
            const mcqImgResponse = await axios.get(`${url}resources/files/url/MCQ_IMAGES/${content.mcq.imageFile}`)
            content.mcq.imageFileUrl = mcqImgResponse.data.signedUrl
          }
          if (content.mcq?.audioFile) {
            const mcqAudioResponse = await axios.get(`${url}resources/files/url/MCQ_AUDIO/${content.mcq.audioFile}`)
            content.mcq.audioFileUrl = mcqAudioResponse.data.signedUrl
          }

          return {
            ...resource,
            content: processResourceContent(content, resource.resourceType)
          }
        }))

        if (page === 1) {
          setResources(formattedResources)
        } else {
          setResources(prev => [...prev, ...formattedResources])
        }
        setHasMore(response.data.hasMore)
        setAllResources(formattedResources)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSectionSelect = async (newSection) => {
    setSectionId(newSection?._id)
    if (newSection?._id) {
      try {
        const response = await getData(`resources/latest-number/${newSection._id}`)
        if (response.status === 200) {
          const nextNumber = response.data.nextNumber
          // Automatically add first resource form
          setResources([{
            name: '',
            number: nextNumber,
            resourceType: '',
            content: getInitialResourceContent()
          }])
        }
      } catch (error) {
        console.error('Error fetching next number:', error)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUploading(true)
    setError('')

    try {
      if (!sectionId) {
        setError('Please select a section')
        return
      }

      // Validate all resources
      const validationErrors = resources.flatMap(resource => validateResource(resource))
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'))
        return
      }

      if (editMode) {
        const updatePromises = resources.map(async resource => {
          const cleanContent = {
            ...resource.content,
            file: undefined,
            backgroundImage: undefined,
            audioFile: undefined,
            fileUrl: undefined,
            backgroundImageUrl: undefined,
            mcq: resource.content.mcq ? {
              ...resource.content.mcq,
              imageFile: undefined,
              audioFile: undefined,
              imageFileUrl: undefined,
              audioFileUrl: undefined
            } : null
          }

          const formData = new FormData()
          formData.append('name', resource.name)
          formData.append('resourceType', resource.resourceType)
          formData.append('content', JSON.stringify(cleanContent))

          // Handle file uploads
          if (resource.content.file instanceof File) {
            formData.append('file', resource.content.file)
          }
          if (resource.content.backgroundImage instanceof File) {
            formData.append('backgroundImage', resource.content.backgroundImage)
          }
          if (resource.content.audioFile instanceof File) {
            formData.append('audioFile', resource.content.audioFile)
          }
          if (resource.content.mcq?.imageFile instanceof File) {
            formData.append('mcqImage', resource.content.mcq.imageFile)
          }
          if (resource.content.mcq?.audioFile instanceof File) {
            formData.append('mcqAudio', resource.content.mcq.audioFile)
          }

          return axios.put(`${url}resources/${resource._id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(percentCompleted)
            }
          })
        })

        await Promise.all(updatePromises)
        alert('Resources updated successfully')
      } else {
        const resourcePromises = resources.map(async resource => {
          const cleanContent = {
            ...resource.content,
            file: undefined,
            backgroundImage: undefined,
            audioFile: undefined,
            mcq: resource.content.mcq ? {
              ...resource.content.mcq,
              imageFile: undefined,
              audioFile: undefined
            } : null
          }

          const formData = new FormData()
          formData.append('name', resource.name)
          formData.append('number', resource.number)
          formData.append('resourceType', resource.resourceType)
          formData.append('sectionId', sectionId)
          formData.append('content', JSON.stringify(cleanContent))

          // Handle file uploads
          if (resource.content.file instanceof File) {
            formData.append('file', resource.content.file)
          }
          if (resource.content.backgroundImage instanceof File) {
            formData.append('backgroundImage', resource.content.backgroundImage)
          }
          if (resource.content.audioFile instanceof File) {
            formData.append('audioFile', resource.content.audioFile)
          }
          if (resource.content.mcq?.imageFile instanceof File) {
            formData.append('mcqImage', resource.content.mcq.imageFile)
          }
          if (resource.content.mcq?.audioFile instanceof File) {
            formData.append('mcqAudio', resource.content.mcq.audioFile)
          }

          return axios.post(`${url}resources`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(percentCompleted)
            }
          })
        })

        await Promise.all(resourcePromises)
        alert('Resources added successfully')
      }

      // Reset form
      setResources([{
        name: '',
        number: null,
        resourceType: '',
        content: getInitialResourceContent()
      }])
    } catch (error) {
      console.error('Error:', error)
      setError('Error uploading resources: ' + error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleViewMedia = (resource) => {
    let mediaUrl = ''
    let type = resource.resourceType

    switch (resource.resourceType) {
      case 'VIDEO':
      case 'AUDIO':
      case 'IMAGE':
      case 'PDF':
        mediaUrl = resource.content.fileUrl
        break
      case 'PPT':
        mediaUrl = resource.content.fileUrl
        break
      case 'MCQ':
        if (resource.content.mcq?.imageFile) {
          mediaUrl = resource.content.mcq.imageFileUrl
          type = 'IMAGE'
        } else if (resource.content.mcq?.audioFile) {
          mediaUrl = resource.content.mcq.audioFileUrl
          type = 'AUDIO'
        }
        break
      default:
        return
    }

    if (mediaUrl) {
      setMediaViewer({
        open: true,
        url: mediaUrl,
        type,
        title: resource.name
      })
    } else {
      alert('Media URL not found')
    }
  }

  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    setShowSearchBackend(false)

    const filtered = allResources.filter(resource =>
      resource.name.toLowerCase().includes(term.toLowerCase())
    )

    if (filtered.length === 0 && term.length > 0) {
      setShowSearchBackend(true)
    }

    setResources(filtered)
  }

  const handleBackendSearch = async () => {
    setIsLoading(true)
    try {
      const response = await getData(`resources/${sectionId}/search?name=${searchTerm}`)
      if (response.status === 200) {
        const formattedResources = await Promise.all(response.data.data.map(async resource => {
          const content = { ...resource.content }

          if (content.fileName) {
            const fileResponse = await axios.get(`${url}resources/files/url/${resource.resourceType}/${content.fileName}`)
            content.fileUrl = fileResponse.data.signedUrl
          }
          if (content.backgroundImage) {
            const bgResponse = await axios.get(`${url}resources/files/url/BACKGROUNDS/${content.backgroundImage}`)
            content.backgroundImageUrl = bgResponse.data.signedUrl
          }
          if (content.mcq?.imageFile) {
            const mcqImgResponse = await axios.get(`${url}resources/files/url/MCQ_IMAGES/${content.mcq.imageFile}`)
            content.mcq.imageFileUrl = mcqImgResponse.data.signedUrl
          }
          if (content.mcq?.audioFile) {
            const mcqAudioResponse = await axios.get(`${url}resources/files/url/MCQ_AUDIO/${content.mcq.audioFile}`)
            content.mcq.audioFileUrl = mcqAudioResponse.data.signedUrl
          }

          return {
            ...resource,
            content: processResourceContent(content, resource.resourceType)
          }
        }))

        setResources(formattedResources)
        setShowSearchBackend(false)
      }
    } catch (error) {
      console.error('Error searching resources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop === clientHeight && hasMore && !isLoading && !searchTerm) {
      setCurrentPage(prev => prev + 1)
      fetchResources(currentPage + 1)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Autocomplete
            fullWidth
            size='small'
            options={courses}
            getOptionLabel={option => option.name}
            value={selectedCourse}
            onChange={(_, newValue) => {
              setSelectedCourse(newValue)
              setCourseId(newValue?._id)
            }}
            disabled={editMode}
            renderInput={params => (
              <TextField
                {...params}
                label='Select Course'
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
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
                    borderRadius: '8px'
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
            onChange={(_, newValue) => handleSectionSelect(newValue)}
            disabled={!unitId}
            renderInput={params => (
              <TextField
                {...params}
                size='small'
                label='Select Section'
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            )}
          />
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {editMode && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Resources"
              value={searchTerm}
              onChange={handleSearch}
              sx={{ mb: 2 }}
            />
            {showSearchBackend && (
              <Button
                variant="outlined"
                onClick={handleBackendSearch}
                sx={{ mb: 2 }}
              >
                Search in all resources
              </Button>
            )}
          </Box>
        )}

        <Box
          sx={{
            maxHeight: '500px',
            overflow: 'auto',
            mb: 2
          }}
          onScroll={handleScroll}
        >
          {resources.map((resource, index) => (
            <Accordion
              key={resource._id || index}
              defaultExpanded={index === 0}
              sx={{
                mb: 2,
                boxShadow: 'none',
                '&:before': {
                  display: 'none'
                },
                borderRadius: '8px'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: 'grey.200',
                  borderRadius: '8px',
                  '&.Mui-expanded': {
                    minHeight: '48px',
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0'
                    }
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography>
                    Resource {resource.number} - {resource.name || `(Unnamed Resource ${index + 1})`}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    value={resource.number}
                    size='small'
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      minWidth: '120px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
                  />
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
                  <Autocomplete
                    fullWidth
                    size='small'
                    options={RESOURCE_TYPES}
                    getOptionLabel={option => option.label}
                    value={RESOURCE_TYPES.find(type => type.value === resource.resourceType) || null}
                    onChange={(_, newValue) => handleFormChange(index, 'resourceType', newValue?.value || '')}
                    disabled={editMode}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Resource Type'
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
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                  {resource.resourceType && (
                    <>
                      {(resource.resourceType === 'VIDEO' ||
                        resource.resourceType === 'AUDIO' ||
                        resource.resourceType === 'IMAGE' ||
                        resource.resourceType === 'PDF' ||
                        resource.resourceType === 'PPT') && (
                          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                            <FileUploader
                              label={`Choose ${resource.resourceType}`}
                              value={resource.content.file}
                              accept={getFileAcceptTypes(resource.resourceType)}
                              onChange={file => handleContentChange(index, 'file', file)}
                              editMode={editMode}
                              existingFile={resource.content.fileName}
                              onView={() => handleViewMedia(resource)}
                            />
                            {(resource.resourceType === 'AUDIO' || resource.resourceType === 'PPT') && (
                              <FileUploader
                                label='Choose Background'
                                value={resource.content.backgroundImage}
                                accept='image/*'
                                onChange={file => handleContentChange(index, 'backgroundImage', file)}
                                editMode={editMode}
                                existingFile={resource.content.backgroundImage}
                                type="secondary"
                                onView={() => handleViewMedia(resource)}
                              />
                            )}
                            {resource.resourceType === 'PDF' && (
                              <FileUploader
                                label='Choose Audio'
                                value={resource.content.audioFile}
                                accept='audio/*'
                                onChange={file => handleContentChange(index, 'audioFile', file)}
                                editMode={editMode}
                                existingFile={resource.content.audioFile}
                                type="secondary"
                                onView={() => handleViewMedia(resource)}
                              />
                            )}
                          </Box>
                        )}

                      {resource.resourceType === 'PDF' && (
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='Audio Repeat Count'
                          value={resource.content.audioRepeatCount || 1}
                          onChange={e => handleContentChange(index, 'audioRepeatCount', parseInt(e.target.value))}
                          slotProps={{
                            input: { min: 1, max: 11 }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      )}

                      {resource.resourceType === 'MCQ' && (
                        <MCQForm
                          content={resource.content}
                          onChange={(field, value) => handleContentChange(index, field, value)}
                          editMode={editMode}
                        />
                      )}

                      {resource.resourceType === 'TEXT' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <FileUploader
                            label='Choose Background'
                            value={resource.content.backgroundImage}
                            accept='image/*'
                            onChange={file => handleContentChange(index, 'backgroundImage', file)}
                            editMode={editMode}
                            existingFile={resource.content.backgroundImage}
                            type="secondary"
                            onView={() => handleViewMedia(resource)}
                          />
                          {resource.content.questions.map((q, qIndex) => (
                            <Box key={qIndex} sx={{ display: 'flex', gap: 2 }}>
                              <TextField
                                fullWidth
                                size='small'
                                label={`Question ${qIndex + 1}`}
                                value={q.question}
                                onChange={e => {
                                  const newQuestions = [...resource.content.questions]
                                  newQuestions[qIndex] = {
                                    ...newQuestions[qIndex],
                                    question: e.target.value
                                  }
                                  handleContentChange(index, 'questions', newQuestions)
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
                              <TextField
                                fullWidth
                                size='small'
                                label={`Answer ${qIndex + 1}`}
                                value={q.answer}
                                onChange={e => {
                                  const newQuestions = [...resource.content.questions]
                                  newQuestions[qIndex] = {
                                    ...newQuestions[qIndex],
                                    answer: e.target.value
                                  }
                                  handleContentChange(index, 'questions', newQuestions)
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
                            </Box>
                          ))}
                        </Box>
                      )}

                      <ExternalLinks
                        links={resource.content.externalLinks}
                        onChange={newLinks => handleContentChange(index, 'externalLinks', newLinks)}
                      />
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {!editMode && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => addResource(resources[0]?.number || 1)}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <AddIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 'bold', color: 'black' }}>
                Add Another Resource
              </Typography>
            </Box>
          )}
          <Button
            type='submit'
            variant='contained'
            sx={{
              bgcolor: editMode ? 'success.main' : 'primary.main',
              '&:hover': {
                bgcolor: editMode ? 'success.dark' : 'primary.dark'
              }
            }}
          >
            {editMode ? 'Save Changes' : 'Save All'}
          </Button>
        </Box>
      </form>

      <MediaViewer
        open={mediaViewer.open}
        onClose={() => setMediaViewer({ ...mediaViewer, open: false })}
        url={mediaViewer.url}
        type={mediaViewer.type}
        title={mediaViewer.title}
      />

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
    </>
  )
}

export default AddResource 