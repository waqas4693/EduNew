import {
  Box,
  Alert,
  Paper,
  Button,
  Select,
  MenuItem,
  Backdrop,
  Checkbox,
  TextField,
  Accordion,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  Autocomplete,
  LinearProgress,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { postData, getData, putData } from '../../api/api'

import axios from 'axios'
import url from '../config/server-url'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const RESOURCE_TYPES = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'PPT', label: 'PPT Slides' },
  { value: 'TEXT', label: 'Text with Questions' },
  { value: 'MCQ', label: 'Multiple Choice Question' }
]

const UploadButton = ({ label, onChange, value, accept, editMode, existingFile }) => (
  <Button
    variant='outlined'
    component='label'
    sx={{
      backgroundColor: '#f5f5f5',
      height: '36px',
      borderRadius: '8px',
      border: '1px solid #20202033',
      overflow: 'hidden',
      padding: '6px 16px',
      flex: 1,
      minWidth: 0
    }}
  >
    <Typography
      noWrap
      sx={{
        width: '100%',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '200px',
        display: 'block',
        textTransform: 'none'
      }}
    >
      {editMode && existingFile ? 'Re-Pick' : (value ? (value.name.length > 20 ? `${value.name.slice(0, 20)}...` : value.name) : label)}
    </Typography>
    <input type='file' hidden accept={accept} onChange={onChange} />
  </Button>
)

const ViewButton = ({ onClick, label }) => (
  <Button
    variant='contained'
    onClick={onClick}
    sx={{
      height: '36px',
      borderRadius: '8px',
      padding: '6px 16px',
      minWidth: '100px',
      ml: 1
    }}
  >
    <Typography
      noWrap
      sx={{
        width: '100%',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '200px',
        display: 'block',
        textTransform: 'none'
      }}
    >
      View
    </Typography>
  </Button>
)

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  )

const AddResource = ({ courseId: propsCourseId, editMode }) => {
  const [resources, setResources] = useState([])
  const [editingResourceId, setEditingResourceId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [nextNumber, setNextNumber] = useState(1)
  const [numberError, setNumberError] = useState('')
  const [error, setError] = useState('')
  const [insertMode, setInsertMode] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSearchBackend, setShowSearchBackend] = useState(false)
  const [allResources, setAllResources] = useState([])

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
        // Format the resources with proper content structure
        const formattedResources = await Promise.all(response.data.resources.map(async resource => {
          // Get signed URLs for any existing files
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

          // Ensure proper structure for MCQ content
          if (content.mcq) {
            content.mcq = {
              ...content.mcq,
              options: content.mcq.options || [],
              correctAnswers: content.mcq.correctAnswers || [],
              numberOfCorrectAnswers: content.mcq.numberOfCorrectAnswers || 1
            }
          }

          // Ensure proper structure for questions
          if (content.questions) {
            content.questions = content.questions.map(q => ({
              question: q.question || '',
              answer: q.answer || ''
            }))
          }

          // Ensure proper structure for external links
          content.externalLinks = content.externalLinks || [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' }
          ]

          return {
            ...resource,
            content
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

  const fetchNextNumber = async selectedSectionId => {
    try {
      const response = await getData(
        `resources/latest-number/${selectedSectionId}`
      )
      if (response.status === 200) {
        setNextNumber(response.data.nextNumber)
        setResources(prev =>
          prev.map((resource, index) => ({
            ...resource,
            number: response.data.nextNumber + index
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching next number:', error)
    }
  }

  const handleSectionSelect = newSection => {
    setSectionId(newSection?._id)
    if (newSection?._id) {
      fetchNextNumber(newSection._id)
      // Only fetch resources in edit mode
      if (editMode) {
        fetchResources()
      }
    }
  }

  const addNewResource = () => {
    setResources(prev => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        resourceType: '',
        content: {
          fileName: '',
          questions: [
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' }
          ],
          backgroundImage: '',
          previewImage: '',
          file: null,
          thumbnail: null,
          externalLinks: [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' }
          ],
          audioFile: null,
          audioRepeatCount: 1,
          mcq: {
            question: '',
            options: ['', '', '', ''],
            numberOfCorrectAnswers: 1,
            correctAnswers: [],
            imageFile: null
          }
        }
      }
    ])
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

  const processResource = async resource => {
    let contentData = { ...resource.content }
    const formData = new FormData()

    const generateUniqueFilename = originalName => {
      const timestamp = Date.now()
      const extension = originalName.split('.').pop()
      return `${timestamp}.${extension}`
    }

    if (resource.content.file) {
      const uniqueFileName = generateUniqueFilename(resource.content.file.name)
      const renamedFile = new File([resource.content.file], uniqueFileName, {
        type: resource.content.file.type
      })
      formData.append('file', renamedFile)
      contentData.fileName = uniqueFileName
    }

    // Handle PDF audio file
    if (resource.resourceType === 'PDF' && resource.content.audioFile) {
      const uniqueAudioName = generateUniqueFilename(resource.content.audioFile.name)
      const renamedAudioFile = new File([resource.content.audioFile], uniqueAudioName, {
        type: resource.content.audioFile.type
      })
      formData.append('audioFile', renamedAudioFile)
      contentData.audioFile = uniqueAudioName
    }

    if (
      (resource.resourceType === 'PPT' ||
        resource.resourceType === 'AUDIO' ||
        resource.resourceType === 'TEXT') &&
      resource.content.backgroundImage
    ) {
      const uniqueBgName = generateUniqueFilename(
        resource.content.backgroundImage.name
      )
      const renamedBgFile = new File(
        [resource.content.backgroundImage],
        uniqueBgName,
        {
          type: resource.content.backgroundImage.type
        }
      )
      formData.append('backgroundImage', renamedBgFile)
      contentData.backgroundImage = uniqueBgName
    }

    if (resource.resourceType === 'MCQ') {
      if (resource.content.mcq?.imageFile) {
        const uniqueMcqImageName = generateUniqueFilename(
          resource.content.mcq.imageFile.name
        )
        const renamedMcqImage = new File(
          [resource.content.mcq.imageFile],
          uniqueMcqImageName,
          {
            type: resource.content.mcq.imageFile.type
          }
        )
        formData.append('mcqImage', renamedMcqImage)
        contentData.mcq = {
          ...contentData.mcq,
          imageFile: uniqueMcqImageName
        }
      }
      if (resource.content.mcq?.audioFile) {
        const uniqueMcqAudioName = generateUniqueFilename(
          resource.content.mcq.audioFile.name
        )
        const renamedMcqAudio = new File(
          [resource.content.mcq.audioFile],
          uniqueMcqAudioName,
          {
            type: resource.content.mcq.audioFile.type
          }
        )
        formData.append('mcqAudio', renamedMcqAudio)
        contentData.mcq = {
          ...contentData.mcq,
          audioFile: uniqueMcqAudioName
        }
      }
    }

    formData.append('name', resource.name)
    formData.append('number', resource.number)
    formData.append('resourceType', resource.resourceType)
    formData.append('sectionId', sectionId)
    formData.append('content', JSON.stringify(contentData))

    return formData
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsUploading(true)

    try {
      if (!sectionId) {
        alert('Please select a section')
        return
      }

      if (editMode) {
        const updatePromises = resources.map(async resource => {
          // Create a clean content object without URLs and extra fields
          const cleanContent = {
            ...resource.content,
            fileUrl: undefined,
            backgroundImageUrl: undefined,
            mcq: resource.content.mcq ? {
              question: resource.content.mcq.question,
              options: resource.content.mcq.options,
              numberOfCorrectAnswers: resource.content.mcq.numberOfCorrectAnswers,
              correctAnswers: resource.content.mcq.correctAnswers,
              imageFile: resource.content.mcq.imageFile,
              audioFile: resource.content.mcq.audioFile
            } : null
          }

          const formData = await processResource({
            ...resource,
            content: cleanContent
          })
          
          return axios.put(`${url}resources/${resource._id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        })

        await Promise.all(updatePromises)
        alert('Resources updated successfully')
      } else {
        const resourcePromises = resources.map(async resource => {
          const formData = await processResource(resource)
          return axios.post(`${url}resources`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        })

        await Promise.all(resourcePromises)
        alert('Resources added successfully')
      }

      // Reset form with proper initial state
      setResources([{
        name: '',
        number: null,
        resourceType: '',
        content: {
          fileName: '',
          questions: [
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' }
          ],
          backgroundImage: '',
          previewImage: '',
          file: null,
          thumbnail: null,
          externalLinks: [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' }
          ],
          mcq: {
            question: '',
            options: ['', '', '', ''],
            numberOfCorrectAnswers: 1,
            correctAnswers: [],
            imageFile: null,
            audioFile: null
          }
        }
      }])
    } catch (error) {
      console.error('Error:', error)
      alert('Error uploading resources')
    } finally {
      setIsUploading(false)
    }
  }

  const removeResource = indexToRemove => {
    setResources(prev => {
      const filtered = prev.filter((_, index) => index !== indexToRemove)
      return filtered.map((resource, index) => ({
        ...resource,
        number: nextNumber + index
      }))
    })
  }

  const handleNumberChange = async (resourceId, newNumber) => {
    try {
      setNumberError('')
      
      // Validate number
      if (newNumber < 1) {
        setNumberError('Number must be positive')
        return
      }

      // Check for duplicates in current state
      const isDuplicate = resources.some(
        resource => resource.number === newNumber && resource._id !== resourceId
      )
      if (isDuplicate) {
        setNumberError('Number already exists')
        return
      }

      // Only update in backend if not in insert mode
      if (!insertMode) {
        // Update in backend
        const response = await putData(`resources/${resourceId}/number`, {
          newNumber,
          sectionId: sectionId
        })

        if (response.status === 200) {
          // Update local state
          setResources(prev => {
            const updated = prev.map(resource => {
              if (resource._id === resourceId) {
                return { ...resource, number: newNumber }
              }
              return resource
            })
            return updated.sort((a, b) => a.number - b.number)
          })
        }
      } else {
        // In insert mode, just update the local state
        setResources(prev => prev.map(resource => ({
          ...resource,
          number: newNumber
        })))
      }
    } catch (error) {
      console.error('Error updating resource number:', error)
      setNumberError(error.response?.data?.message || 'Failed to update number')
    }
  }

  const handleInsertClick = () => {
    setInsertMode(true)
    setResources([{
      name: '',
      number: 1,
      resourceType: '',
      content: {
        fileName: '',
        questions: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ],
        backgroundImage: '',
        file: null,
        thumbnail: null,
        externalLinks: [
          { name: '', url: '' },
          { name: '', url: '' },
          { name: '', url: '' }
        ],
        audioFile: null,
        audioRepeatCount: 1,
        mcq: {
          question: '',
          options: ['', '', '', ''],
          numberOfCorrectAnswers: 1,
          correctAnswers: [],
          imageFile: null
        }
      }
    }])
  }

  const handleInsertSubmit = async () => {
    try {
      setError('')
      
      // Validate inputs
      if (!sectionId) {
        setError('Please select a section first')
        return
      }

      if (!resources[0].name) {
        setError('Please enter a resource name')
        return
      }

      if (!resources[0].resourceType) {
        setError('Please select a resource type')
        return
      }

      if (resources[0].number < 1) {
        setNumberError('Number must be positive')
        return
      }

      // Send insert request
      const response = await postData('resources/insert', {
        newResource: {
          name: resources[0].name,
          number: resources[0].number,
          sectionId: sectionId,
          resourceType: resources[0].resourceType,
          content: resources[0].content
        }
      })

      if (response.status === 201) {
        setInsertMode(false)
        setResources([])
      }
    } catch (error) {
      console.error('Error inserting resource:', error)
      setError(error.response?.data?.message || 'Failed to insert resource')
    }
  }

  const handleEditResource = (resourceId) => {
    setEditingResourceId(resourceId)
  }

  const handleCancelEdit = () => {
    setEditingResourceId(null)
    // Optionally refresh the resource data
    if (sectionId) {
      fetchResources()
    }
  }

  const handleSaveResource = async (resource) => {
    setIsSaving(true)
    try {
      const cleanContent = {
        ...resource.content,
        fileUrl: undefined,
        backgroundImageUrl: undefined,
        mcq: resource.content.mcq ? {
          ...resource.content.mcq,
          imageFileUrl: undefined,
          audioFileUrl: undefined
        } : null
      }

      const formData = await processResource({
        ...resource,
        content: cleanContent
      })

      await axios.put(`${url}resources/${resource._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setEditingResourceId(null)
      alert('Resource updated successfully')
      // Refresh the resource data
      if (sectionId) {
        fetchResources()
      }
    } catch (error) {
      console.error('Error updating resource:', error)
      alert('Error updating resource')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCourseSelect = (_, newValue) => {
    setCourseId(newValue?._id)
    setSelectedCourse(newValue)
  }

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    setShowSearchBackend(false)
    
    // First, filter loaded resources
    const filtered = allResources.filter(resource => 
      resource.name.toLowerCase().includes(term.toLowerCase())
    )
    
    if (filtered.length === 0 && term.length > 0) {
      setShowSearchBackend(true)
    }
    
    setResources(filtered)
  }

  // Handle backend search
  const handleBackendSearch = async () => {
    setIsLoading(true)
    try {
      const response = await getData(`resources/${sectionId}/search?name=${searchTerm}`)
      if (response.status === 200) {
        // Format the searched resources
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

          // Ensure proper structure for MCQ content
          if (content.mcq) {
            content.mcq = {
              ...content.mcq,
              options: content.mcq.options || [],
              correctAnswers: content.mcq.correctAnswers || [],
              numberOfCorrectAnswers: content.mcq.numberOfCorrectAnswers || 1
            }
          }

          // Ensure proper structure for questions
          if (content.questions) {
            content.questions = content.questions.map(q => ({
              question: q.question || '',
              answer: q.answer || ''
            }))
          }

          // Ensure proper structure for external links
          content.externalLinks = content.externalLinks || [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' }
          ]

          return {
            ...resource,
            content
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

  // Handle scroll to load more
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop === clientHeight && hasMore && !isLoading && !searchTerm) {
      setCurrentPage(prev => prev + 1)
      fetchResources(currentPage + 1)
    }
  }

  // Add useEffect for initial load
  useEffect(() => {
    if (sectionId && editMode) {
      setCurrentPage(1)
      fetchResources(1)
    }
  }, [sectionId, editMode])

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
            onChange={handleCourseSelect}
            disabled={editMode || insertMode}
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
            disabled={!courseId || insertMode}
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
            disabled={!unitId || insertMode}
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
                  {editMode && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {editingResourceId === resource._id ? (
                        <>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleSaveResource(resource)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditResource(resource._id)}
                        >
                          Edit
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ opacity: editingResourceId === resource._id ? 1 : 0.7 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      type="number"
                      size="small"
                      label="Resource Number"
                      value={resource.number}
                      disabled
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
                      onChange={e =>
                        handleFormChange(index, 'name', e.target.value)
                      }
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
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
                        onChange={e =>
                          handleFormChange(index, 'resourceType', e.target.value)
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
                        {RESOURCE_TYPES.map(type => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    {resource.resourceType === 'VIDEO' && (
                      <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                        <UploadButton
                          label='Choose Video'
                          value={resource.content.file}
                          accept='video/*'
                          onChange={e =>
                            handleContentChange(index, 'file', e.target.files[0])
                          }
                          editMode={editMode}
                          existingFile={resource.content.fileName}
                        />
                        {editMode && resource.content.fileName && (
                          <ViewButton
                            onClick={() => window.open(`${url}resources/files/url/${resource.resourceType}/${resource.content.fileName}`, '_blank')}
                          />
                        )}
                      </Box>
                    )}

                    {resource.resourceType === 'AUDIO' && (
                      <>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose Audio'
                            value={resource.content.file}
                            accept='audio/*'
                            onChange={e =>
                              handleContentChange(index, 'file', e.target.files[0])
                            }
                            editMode={editMode}
                            existingFile={resource.content.fileName}
                          />
                          {editMode && resource.content.fileName && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/${resource.resourceType}/${resource.content.fileName}`, '_blank')}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose Background'
                            value={resource.content.backgroundImage}
                            accept='image/*'
                            onChange={e =>
                              handleContentChange(
                                index,
                                'backgroundImage',
                                e.target.files[0]
                              )
                            }
                            editMode={editMode}
                            existingFile={resource.content.backgroundImage}
                          />
                          {editMode && resource.content.backgroundImage && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/BACKGROUNDS/${resource.content.backgroundImage}`, '_blank')}
                            />
                          )}
                        </Box>
                      </>
                    )}

                    {resource.resourceType === 'PPT' && (
                      <>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose PPT'
                            value={resource.content.file}
                            accept='.ppt,.pptx'
                            onChange={e =>
                              handleContentChange(index, 'file', e.target.files[0])
                            }
                            editMode={editMode}
                            existingFile={resource.content.fileName}
                          />
                          {editMode && resource.content.fileName && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/${resource.resourceType}/${resource.content.fileName}`, '_blank')}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose Preview'
                            value={resource.content.backgroundImage}
                            accept='image/*'
                            onChange={e =>
                              handleContentChange(
                                index,
                                'backgroundImage',
                                e.target.files[0]
                              )
                            }
                            editMode={editMode}
                            existingFile={resource.content.backgroundImage}
                          />
                          {editMode && resource.content.backgroundImage && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/BACKGROUNDS/${resource.content.backgroundImage}`, '_blank')}
                            />
                          )}
                        </Box>
                      </>
                    )}

                    {resource.resourceType === 'PDF' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose PDF'
                            value={resource.content.file}
                            accept='.pdf'
                            onChange={e =>
                              handleContentChange(index, 'file', e.target.files[0])
                            }
                            editMode={editMode}
                            existingFile={resource.content.fileName}
                          />
                          {editMode && resource.content.fileName && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/${resource.resourceType}/${resource.content.fileName}`, '_blank')}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose Audio'
                            value={resource.content.audioFile}
                            accept='audio/*'
                            onChange={e =>
                              handleContentChange(index, 'audioFile', e.target.files[0])
                            }
                            editMode={editMode}
                            existingFile={resource.content.audioFile}
                          />
                          {editMode && resource.content.audioFile && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/AUDIO/${resource.content.audioFile}`, '_blank')}
                            />
                          )}
                        </Box>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          label='Audio Repeat Count'
                          value={resource.content.audioRepeatCount || 1}
                          onChange={e =>
                            handleContentChange(
                              index,
                              'audioRepeatCount',
                              parseInt(e.target.value)
                            )
                          }
                          slotProps={{
                            input: { min: 1, max: 11 }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </Box>
                    )}

                    {resource.resourceType === 'IMAGE' && (
                      <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                        <UploadButton
                          label='Choose Image'
                          value={resource.content.file}
                          accept='image/*'
                          onChange={e =>
                            handleContentChange(index, 'file', e.target.files[0])
                          }
                          editMode={editMode}
                          existingFile={resource.content.fileName}
                        />
                        {editMode && resource.content.fileName && (
                          <ViewButton
                            onClick={() => window.open(`${url}resources/files/url/${resource.resourceType}/${resource.content.fileName}`, '_blank')}
                          />
                        )}
                      </Box>
                    )}

                    {resource.resourceType === 'TEXT' && (
                      <UploadButton
                        label='Choose Background'
                        value={resource.content.backgroundImage}
                        accept='image/*'
                        onChange={e =>
                          handleContentChange(
                            index,
                            'backgroundImage',
                            e.target.files[0]
                          )
                        }
                        editMode={editMode}
                        existingFile={resource.content.backgroundImage}
                      />
                    )}

                    {resource.resourceType === 'MCQ' && (
                      <>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
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
                            editMode={editMode}
                            existingFile={resource.content.mcq?.imageFile}
                          />
                          {editMode && resource.content.mcq?.imageFile && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/MCQ_IMAGES/${resource.content.mcq.imageFile}`, '_blank')}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                          <UploadButton
                            label='Choose Audio'
                            value={resource.content.mcq?.audioFile}
                            accept='audio/*'
                            onChange={e =>
                              handleContentChange(index, 'mcq', {
                                ...resource.content.mcq,
                                audioFile: e.target.files[0]
                              })
                            }
                            editMode={editMode}
                            existingFile={resource.content.mcq?.audioFile}
                          />
                          {editMode && resource.content.mcq?.audioFile && (
                            <ViewButton
                              onClick={() => window.open(`${url}resources/files/url/MCQ_AUDIO/${resource.content.mcq.audioFile}`, '_blank')}
                            />
                          )}
                        </Box>
                      </>
                    )}
                  </Box>

                  {resource.resourceType === 'TEXT' && (
                    <>
                      {resource.content.questions.map((q, qIndex) => (
                        <Box key={qIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                              handleContentChange(
                                index,
                                'questions',
                                newQuestions
                              )
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
                              handleContentChange(
                                index,
                                'questions',
                                newQuestions
                              )
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
                    </>
                  )}

                  {resource.resourceType === 'MCQ' && (
                    <Box sx={{ mt: 2 }}>
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
                              const currentOptions =
                                resource.content.mcq?.options || []
                              const newOptions = Array(numOptions)
                                .fill('')
                                .map((_, i) => currentOptions[i] || '')
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
                            {[2, 3, 4, 5, 6].map(num => (
                              <MenuItem key={num} value={num}>
                                {num} Options
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size='small'>
                          <InputLabel
                            sx={{
                              color: '#8F8F8F',
                              backgroundColor: 'white',
                              padding: '0 4px'
                            }}
                          >
                            Number of Correct Answers
                          </InputLabel>
                          <Select
                            value={
                              resource.content.mcq?.numberOfCorrectAnswers || 1
                            }
                            onChange={e =>
                              handleContentChange(index, 'mcq', {
                                ...resource.content.mcq,
                                numberOfCorrectAnswers: e.target.value,
                                correctAnswers: []
                              })
                            }
                            sx={{
                              borderRadius: '8px',
                              border: '1px solid #20202033',
                              '& .MuiOutlinedInput-notchedOutline': {
                                border: 'none'
                              }
                            }}
                          >
                            {[1, 2, 3, 4, 5, 6].map(num => (
                              <MenuItem key={num} value={num}>
                                {num} Correct Answers
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          mb: 2
                        }}
                      >
                        {chunk(resource.content.mcq?.options || [], 2).map(
                          (optionPair, pairIndex) => (
                            <Box key={pairIndex} sx={{ display: 'flex', gap: 2 }}>
                              {optionPair.map((option, optionIndex) => (
                                <TextField
                                  key={pairIndex * 2 + optionIndex}
                                  fullWidth
                                  size='small'
                                  label={`Option ${
                                    pairIndex * 2 + optionIndex + 1
                                  }`}
                                  value={option}
                                  onChange={e => {
                                    const newOptions = [
                                      ...(resource.content.mcq?.options || [])
                                    ]
                                    newOptions[pairIndex * 2 + optionIndex] =
                                      e.target.value
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
                          )
                        )}
                      </Box>

                      <FormControl fullWidth size='small' sx={{ mb: 2 }}>
                        <InputLabel
                          sx={{
                            color: '#8F8F8F',
                            backgroundColor: 'white',
                            padding: '0 4px'
                          }}
                        >
                          Correct Answers
                        </InputLabel>
                        <Select
                          multiple
                          value={resource.content.mcq?.correctAnswers || []}
                          onChange={e =>
                            handleContentChange(index, 'mcq', {
                              ...resource.content.mcq,
                              correctAnswers: e.target.value
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
                          renderValue={selected => selected.join(', ')}
                        >
                          {resource.content.mcq?.options?.map(
                            (option, optIndex) => (
                              <MenuItem key={optIndex} value={option}>
                                <Checkbox
                                  checked={resource.content.mcq?.correctAnswers.includes(
                                    option
                                  )}
                                />
                                Option {optIndex + 1}: {option}
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {resource.resourceType === 'AUDIO' && (
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Repeat Count'
                      value={resource.content.repeatCount || 1}
                      onChange={e =>
                        handleContentChange(
                          index,
                          'repeatCount',
                          parseInt(e.target.value)
                        )
                      }
                      slotProps={{
                        input: { min: 1, max: 11 }
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
                        }
                      }}
                    />
                  )}

                  <Box sx={{ mb: 2 }}>
                    {resource.content.externalLinks.map((link, linkIndex) => (
                      <Box
                        key={linkIndex}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          mb: linkIndex < 2 ? 2 : 0
                        }}
                      >
                        <TextField
                          fullWidth
                          size='small'
                          label={`Link ${linkIndex + 1} Name`}
                          value={link.name}
                          onChange={e => {
                            const newLinks = [...resource.content.externalLinks]
                            newLinks[linkIndex] = {
                              ...newLinks[linkIndex],
                              name: e.target.value
                            }
                            handleContentChange(index, 'externalLinks', newLinks)
                          }}
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
                          label={`External Link ${linkIndex + 1}`}
                          value={link.url}
                          onChange={e => {
                            const newLinks = [...resource.content.externalLinks]
                            newLinks[linkIndex] = {
                              ...newLinks[linkIndex],
                              url: e.target.value
                            }
                            handleContentChange(index, 'externalLinks', newLinks)
                          }}
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
          {!editMode && !insertMode && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={addNewResource}
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
              <Button
                variant="outlined"
                onClick={handleInsertClick}
                sx={{ ml: 2 }}
              >
                Insert Resource
              </Button>
            </Box>
          )}
          {insertMode && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setInsertMode(false)
                  setResources([])
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleInsertSubmit}
                disabled={!resources[0]?.name || !sectionId || !resources[0]?.resourceType}
              >
                Insert
              </Button>
            </>
          )}
          {!insertMode && (
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
              {editMode ? 'Edit' : 'Save All'}
            </Button>
          )}
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
    </>
  )
}

export default AddResource
