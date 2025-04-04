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
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { postData, getData, putData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NumberInput from '../common/NumberInput'

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
      backgroundColor: '#f5f5f5',
      height: '36px',
      borderRadius: '8px',
      border: '1px solid #20202033',
      overflow: 'hidden',
      padding: '6px 16px',
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
      {value
        ? value.name.length > 20
          ? `${value.name.slice(0, 20)}...`
          : value.name
        : label}
    </Typography>
    <input type='file' hidden accept={accept} onChange={onChange} />
  </Button>
)

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  )

const AddResource = ({ courseId: propsCourseId, editMode }) => {
  const [resources, setResources] = useState([
    {
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
          imageFile: null
        }
      }
    }
  ])
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

  useEffect(() => {
    fetchCourses()
    if (editMode && propsCourseId) {
      setCourseId(propsCourseId)
    }
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
    if (sectionId) {
      fetchResources()
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

  const fetchResources = async () => {
    if (editMode && sectionId) {
      try {
        const response = await getData(`resources/${sectionId}`)
        if (response.status === 200 && response.data.resources) {
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

            return {
              ...resource,
              content
            }
          }))
          setResources(formattedResources)
        }
      } catch (error) {
        console.error('Error fetching resources:', error)
      }
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
          const formData = await processResource(resource)
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

      setResources([
        {
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
              imageFile: null
            }
          }
        }
      ])
      // setSectionId(null)
      // setUnitId(null)
      // setCourseId(null)
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
    } catch (error) {
      console.error('Error updating resource number:', error)
      setNumberError(error.response?.data?.message || 'Failed to update number')
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
            onChange={(_, newValue) => setCourseId(newValue?._id)}
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

        {resources.map((resource, index) => (
          <Accordion
            key={index}
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
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  marginLeft: '8px'
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between'
                }}
              >
                <Typography>
                  Resource {resource.number} -{' '}
                  {resource.name || `(Unnamed Resource ${index + 1})`}
                </Typography>
                {index > 0 && (
                  <IconButton
                    onClick={e => {
                      e.stopPropagation()
                      removeResource(index)
                    }}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white'
                      }
                    }}
                    size='small'
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <NumberInput
                    value={resource.number}
                    onChange={(newNumber) => handleNumberChange(resource._id, newNumber)}
                    disabled={!editMode}
                    error={!!numberError}
                    helperText={numberError}
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

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: resource.resourceType ? 2 : 0
                  }}
                >
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
                          handleContentChange(
                            index,
                            'backgroundImage',
                            e.target.files[0]
                          )
                        }
                      />
                    </>
                  )}

                  {resource.resourceType === 'PPT' && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                        value={resource.content.backgroundImage}
                        accept='image/*'
                        onChange={e =>
                          handleContentChange(
                            index,
                            'backgroundImage',
                            e.target.files[0]
                          )
                        }
                      />
                    </Box>
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
                        handleContentChange(
                          index,
                          'backgroundImage',
                          e.target.files[0]
                        )
                      }
                    />
                  )}

                  {resource.resourceType === 'MCQ' && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                      />
                    </Box>
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
              </>
            </AccordionDetails>
          </Accordion>
        ))}

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
            {editMode ? 'Edit' : 'Save All'}
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
    </>
  )
}

export default AddResource
