import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  LinearProgress,
  Autocomplete,
  TextField,
  Card,
  CardContent,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Description as DocIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { postData, getData } from '../../api/api'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const RESOURCE_TYPES = ['VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'PPT']

const ResourceTypeSelector = ({ value, onChange, error }) => (
  <Select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    error={Boolean(error)}
    size="small"
    fullWidth
  >
    {RESOURCE_TYPES.map(type => (
      <MenuItem key={type} value={type}>
        {type}
      </MenuItem>
    ))}
  </Select>
)

const FilePreview = ({ file }) => {
  if (!file) return null

  return (
    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
    </Typography>
  )
}

const detectResourceType = (title) => {

  console.log('title checking for resource', title)

  const titleLower = title.toLowerCase()
  if (titleLower.includes('video')) return 'VIDEO'
  if (titleLower.includes('audio')) return 'AUDIO'
  if (titleLower.includes('image')) return 'IMAGE'
  if (titleLower.includes('pdf')) return 'PDF'
  if (titleLower.includes('ppt') || titleLower.includes('presentation')) return 'PPT'
  return '' // default empty if no match
}

const VideoResourceConfig = ({ resource, onUpdate }) => {
  return (
    <Box sx={{ px: '5px', py: '10px' }}>
      <Box sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        mb: 2 
      }}>
        <input
          type="file"
          style={{ display: 'none' }}
          id={`resource-input-${resource.videoNumber}`}
          onChange={(e) => {
            const file = e.target.files[0]
            onUpdate(resource.videoNumber, {
              ...resource,
              resourceFile: file,
              resourceName: resource.title,
              resourceType: resource.resourceType
            })
          }}
        />
        <label htmlFor={`resource-input-${resource.videoNumber}`}>
          <Button
            variant="contained"
            component="span"
            startIcon={resource.resourceFile ? <CheckCircleIcon /> : <FolderIcon />}
            size="small"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              bgcolor: resource.resourceFile ? 'success.main' : 'primary.main',
              '&:hover': {
                bgcolor: resource.resourceFile ? 'success.dark' : 'primary.dark'
              }
            }}
          >
            {resource.resourceFile ? 'File Picked' : 'Select Resource'}
          </Button>
        </label>

        <Box sx={{ 
          display: 'flex', 
          flex: 1,
          gap: 2 
        }}>
          <TextField
            size="small"
            label="Resource Name"
            value={resource.resourceName || resource.title}
            onChange={(e) => onUpdate(resource.videoNumber, {
              ...resource,
              resourceName: e.target.value
            })}
            sx={{
              flex: '0 0 70%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
          
          {/* Display resource type as text */}
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              bgcolor: 'grey.100',
              px: 2,
              borderRadius: 1,
              fontSize: '0.875rem'
            }}
          >
            {resource.resourceType}
          </Typography>
        </Box>
      </Box>

      {/* Optimized MCQs Summary */}
      {resource.mcqs && resource.mcqs.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{
            mb: 1,
            color: 'text.secondary',
            fontSize: '0.875rem'
          }}>
            MCQs Summary
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', // Smaller cards
            gap: 1 // Reduced gap
          }}>
            {resource.mcqs.map((mcq, index) => (
              <Card
                key={index}
                sx={{
                  p: 1, // Reduced padding
                  border: '1px solid',
                  borderColor: 'primary.light',
                  boxShadow: 'none',
                  borderRadius: '4px', // Smaller border radius
                  bgcolor: mcq.correctAnswersCount > 1 ? 'warning.lighter' : 'background.paper'
                }}
              >
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5 // Reduced margin
                }}>
                  <Typography sx={{
                    color: 'primary.main',
                    fontSize: '0.875rem' // Smaller font
                  }}>
                    Q{mcq.questionNumber}
                  </Typography>
                  {mcq.correctAnswersCount > 1 && (
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: '2px',
                        fontSize: '0.7rem'
                      }}
                    >
                      Multiple
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                  Opts: {mcq.optionsCount} | Correct: {mcq.correctAnswersCount}
                </Typography>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

const MCQDetailedPreview = ({ mcqPreview, onVideoResourceUpdate }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {mcqPreview.videoResources?.map((resource) => (
        <VideoResourceConfig
          key={resource.videoNumber}
          resource={resource}
          onUpdate={onVideoResourceUpdate}
        />
      ))}
    </Box>
  )
}

const BulkUpload = () => {
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [courseId, setCourseId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [overallProgress, setOverallProgress] = useState(0)
  const [fileProgress, setFileProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sectionGroups, setSectionGroups] = useState([
    { section: null, resources: [] }
  ])
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null })
  const [mcqFile, setMcqFile] = useState(null)
  const [mcqPreview, setMcqPreview] = useState(null)

  // Add this function to handle resource updates
  const handleVideoResourceUpdate = (videoNumber, updatedResource) => {
    setMcqPreview(prevPreview => {
      if (!prevPreview) return null

      return {
        ...prevPreview,
        videoResources: prevPreview.videoResources.map(resource =>
          resource.videoNumber === videoNumber ? updatedResource : resource
        )
      }
    })
  }

  // Modified to handle regular file selection
  const handleFileSelect = (event, groupIndex) => {
    const files = Array.from(event.target.files)

    setSectionGroups(prevGroups => {
      const newGroups = [...prevGroups]
      const currentGroup = newGroups[groupIndex]

      if (!currentGroup.section) {
        setError('Please select a section first')
        return prevGroups
      }

      const newResources = files.map(file => ({
        file,
        filename: file.name,
        name: file.name.split('.')[0],
        type: detectResourceType(file.name),
        error: ''
      }))

      currentGroup.resources = [...currentGroup.resources, ...newResources]
      return newGroups
    })
  }

  // New handler for MCQ file
  const handleMcqFileSelect = async (event, groupIndex) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target.result
      
      const videoSections = content.split(/(?:Video|Audio|Image|PDF|PPT) \d+:/)
        .filter(section => section.trim())
        .map(section => section.trim())

      const videoResources = []
      let globalQuestionNumber = 1

      // Get the original sections with their headers to extract resource type
      const fullSections = content.match(/(?:Video|Audio|Image|PDF|PPT) \d+:[\s\S]+?(?=(?:Video|Audio|Image|PDF|PPT) \d+:|$)/g) || []

      fullSections.forEach((section, index) => {
        const lines = section.split('\n')
        const titleLine = lines[0].trim()
        
        // Extract resource type from the title line (e.g., "Audio 1: Title" -> "AUDIO")
        const typeMatch = titleLine.match(/^(Video|Audio|Image|PDF|PPT)/i)
        const resourceType = typeMatch ? typeMatch[1].toUpperCase() : 'VIDEO'
        
        // Remove the "Type X:" prefix to get clean title
        const videoTitle = titleLine.replace(/^(?:Video|Audio|Image|PDF|PPT) \d+:\s*/, '').trim()
        
        // Process MCQs for this section
        const mcqText = lines.slice(1).join('\n')
        const mcqs = mcqText.split(/\s+\d+\./m)
          .filter(mcq => mcq.trim())
          .map(mcq => {
            const lines = mcq.split('\n').map(line => line.trim())
            const question = lines[0]
            const options = lines.filter(line => /^[A-F]\./.test(line))
              .map(line => line.replace(/^[A-F]\./, '').trim())
            const answerLine = lines.find(line => line.startsWith('Answer:'))
            const correctAnswers = answerLine
              ? answerLine.replace('Answer:', '')
                  .trim()
                  .split(',')
                  .map(answer => answer.trim())
              : []

            return {
              questionNumber: globalQuestionNumber++,
              question,
              options,
              optionsCount: options.length,
              correctAnswers,
              correctAnswersCount: correctAnswers.length
            }
          })

        videoResources.push({
          title: videoTitle,
          videoNumber: index + 1,
          resourceFile: null,
          resourceName: videoTitle,
          resourceType: resourceType,
          mcqs
        })
      })

      console.log('Parsed MCQ data:', JSON.stringify(videoResources, null, 2))
      setMcqPreview({
        videoResources
      })
    }
    reader.readAsText(file)
  }

  // Fetch initial data
  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId) fetchUnits()
  }, [courseId])

  useEffect(() => {
    if (selectedUnit?._id) fetchSections()
  }, [selectedUnit])

  // Data fetching functions
  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      setError('Failed to fetch courses')
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units)
      }
    } catch (error) {
      setError('Failed to fetch units')
    }
  }

  const fetchSections = async () => {
    try {
      const response = await getData(`sections/${selectedUnit._id}`)
      if (response.status === 200) {
        setSections(response.data.sections)
      }
    } catch (error) {
      setError('Failed to fetch sections')
    }
  }

  // Resource configuration handlers
  const handleResourceConfigChange = (groupIndex, resourceIndex, field, value) => {
    setSectionGroups(prev => {
      const newGroups = [...prev]
      const resources = [...newGroups[groupIndex].resources]
      resources[resourceIndex] = { ...resources[resourceIndex], [field]: value }
      newGroups[groupIndex] = { ...newGroups[groupIndex], resources }
      return newGroups
    })
  }

  const removeResource = (groupIndex, resourceIndex) => {
    setSectionGroups(prev => {
      const newGroups = [...prev]
      const resources = newGroups[groupIndex].resources.filter((_, i) => i !== resourceIndex)
      newGroups[groupIndex] = { ...newGroups[groupIndex], resources }
      return newGroups
    })
  }

  const addNewSectionGroup = () => {
    setSectionGroups(prev => [...prev, { section: null, resources: [] }])
  }

  const removeSectionGroup = (index) => {
    setSectionGroups(prev => prev.filter((_, i) => i !== index))
  }

  const handleSectionChange = (index, newSection) => {
    setSectionGroups(prev => {
      const newGroups = [...prev]
      newGroups[index] = { ...newGroups[index], section: newSection }
      return newGroups
    })
  }

  // Modify the validateConfigs function to only check MCQ requirements
  const validateConfigs = () => {
    const errors = []
    if (!mcqPreview) {
      errors.push('Please select an MCQ file')
    }
    if (!sectionGroups[0].section) {
      errors.push('Please select a section')
    }
    return errors
  }

  // Modify uploadFiles to only handle MCQ upload
  const uploadFiles = async () => {
    const validationErrors = validateConfigs()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'))
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()

      console.log('Starting resource creation from mcqPreview:', mcqPreview)

      const resources = mcqPreview.videoResources.flatMap((videoResource, videoIndex) => {
        console.log(`Processing video resource ${videoIndex + 1}:`, videoResource)

        const resources = []

        // First add the video resource if it exists
        if (videoResource.resourceFile) {
          const videoResourceObj = {
            name: videoResource.resourceName || videoResource.title,
            sectionId: sectionGroups[0].section._id,
            resourceType: videoResource.resourceType || 'VIDEO',
            content: {
              fileName: videoResource.resourceFile.name
            }
          }
          console.log(`Created video resource object:`, videoResourceObj)
          resources.push(videoResourceObj)
        }

        // Modified MCQ processing
        videoResource.mcqs.forEach((mcq, mcqIndex) => {
          console.log(`Processing MCQ ${mcqIndex + 1} for video ${videoIndex + 1}:`, mcq)

          // Create a mapping of letter options to full text
          const optionMap = {}
          const letters = ['A', 'B', 'C', 'D', 'E', 'F']
          mcq.options.forEach((opt, index) => {
            optionMap[letters[index]] = opt.trim()
          })

          console.log('Option mapping:', optionMap)

          // Convert letter answers to full text answers
          const formattedCorrectAnswers = mcq.correctAnswers.map(letter => {
            const fullAnswer = optionMap[letter]
            if (!fullAnswer) {
              const error = `No matching option found for answer "${letter}" in MCQ ${mcq.questionNumber}`
              console.error(error, {
                letter,
                availableOptions: optionMap
              })
              throw new Error(error)
            }
            console.log(`Converted answer "${letter}" to "${fullAnswer}"`)
            return fullAnswer
          })

          const mcqResourceObj = {
            name: `MCQ ${mcq.questionNumber}`,
            sectionId: sectionGroups[0].section._id,
            resourceType: 'MCQ',
            content: {
              mcq: {
                question: mcq.question || `Question ${mcq.questionNumber}`,
                options: mcq.options.map(opt => opt.trim()),
                numberOfCorrectAnswers: formattedCorrectAnswers.length,
                correctAnswers: formattedCorrectAnswers
              }
            }
          }
          console.log(`Created MCQ resource object:`, mcqResourceObj)
          resources.push(mcqResourceObj)
        })

        return resources
      })

      formData.append('resources', JSON.stringify(resources))

      // Log files being appended
      mcqPreview.videoResources.forEach((resource, index) => {
        if (resource.resourceFile) {
          console.log(`Appending file for video ${index + 1}:`, {
            name: resource.resourceFile.name,
            type: resource.resourceFile.type,
            size: resource.resourceFile.size
          })
          formData.append('files', resource.resourceFile)
        }
      })

      // Log the final FormData contents
      console.log('FormData entries:')
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1])
      }

      const response = await postData('bulk-upload/mcq', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          setFileProgress(progress)
          setOverallProgress(progress)
        }
      })

      console.log('Upload response:', response)

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed')
      }

      setSuccess('Resources uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      setError(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Paper elevation={5} sx={{ p: '20px', borderRadius: '16px' }}>
        <Box
          sx={{
            mb: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Bulk Resource Upload
          </Typography>
        </Box>

        {/* Course and Unit Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            Step 1: Select Course and Unit
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              options={courses}
              value={selectedCourse}
              getOptionLabel={option => option?.name || ''}
              onChange={(_, newValue) => {
                setSelectedCourse(newValue)
                setCourseId(newValue?._id)
                setSelectedUnit(null)
                setSections([])
                setSectionGroups([{ section: null, resources: [] }])
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Course"
                  size="small"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />

            <Autocomplete
              options={units}
              value={selectedUnit}
              getOptionLabel={option => option?.name || ''}
              onChange={(_, newValue) => {
                setSelectedUnit(newValue)
                setSections([])
                setSectionGroups([{ section: null, resources: [] }])
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Unit"
                  size="small"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section Groups */}
        {sectionGroups.map((group, groupIndex) => (
          <Accordion
            key={groupIndex}
            defaultExpanded={groupIndex === sectionGroups.length - 1}
            sx={{
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px !important',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
              sx={{
                backgroundColor: 'primary.main',
                borderRadius: '8px 8px 0 0',
                color: 'white',
                '& .MuiAccordionSummary-content': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {group.section ? `Section: ${group.section.name}` : 'New Section'}
              </Typography>
              {groupIndex > 0 && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSectionGroup(groupIndex)
                  }}
                  size="small"
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Autocomplete
                  options={sections}
                  value={group.section}
                  getOptionLabel={option => option?.name || ''}
                  onChange={(_, value) => handleSectionChange(groupIndex, value)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Select Section"
                      size="small"
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

              {/* File Selection Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <input
                  type="file"
                  accept=".doc,.docx,.txt"
                  style={{ display: 'none' }}
                  id={`mcq-input-${groupIndex}`}
                  onChange={(e) => handleMcqFileSelect(e, groupIndex)}
                />
                <label htmlFor={`mcq-input-${groupIndex}`}>
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<DocIcon />}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none'
                    }}
                  >
                    Select MCQ File
                  </Button>
                </label>
              </Box>

              {/* MCQ Preview */}
              {mcqPreview && (
                <MCQDetailedPreview
                  mcqPreview={mcqPreview}
                  onVideoResourceUpdate={handleVideoResourceUpdate}
                />
              )}

              {/* Resources List */}
              {group.resources.map((resource, resourceIndex) => (
                <Card
                  key={resourceIndex}
                  sx={{
                    mb: 2,
                    borderRadius: '8px',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <TextField
                          size="small"
                          label="Resource Name"
                          value={resource.name}
                          onChange={(e) => handleResourceConfigChange(
                            groupIndex,
                            resourceIndex,
                            'name',
                            e.target.value
                          )}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />

                        <Box sx={{ width: '200px' }}>
                          <ResourceTypeSelector
                            value={resource.type}
                            onChange={(value) => handleResourceConfigChange(
                              groupIndex,
                              resourceIndex,
                              'type',
                              value
                            )}
                            error={resource.error}
                          />
                        </Box>
                      </Box>

                      <IconButton
                        onClick={() => removeResource(groupIndex, resourceIndex)}
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.light'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <FilePreview file={resource.file} />
                  </CardContent>
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Bottom Actions Container */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 3
        }}>
          {/* Add Section Button - Left side */}
          <Button
            startIcon={<AddIcon />}
            onClick={addNewSectionGroup}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            Add Another Section
          </Button>

          {/* Upload Button - Right side */}
          <Button
            variant="contained"
            onClick={uploadFiles}
            disabled={uploading || !mcqPreview}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Start Upload'}
          </Button>
        </Box>

        {/* Upload Progress */}
        {/* {uploading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Uploading: {currentFile}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={fileProgress}
              sx={{
                mb: 2,
                borderRadius: '4px',
                backgroundColor: 'primary.light'
              }}
            />
            <Typography variant="body2" sx={{ mb: 1 }}>
              Overall Progress: {Math.round(overallProgress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{
                borderRadius: '4px',
                backgroundColor: 'primary.light'
              }}
            />
          </Box>
        )} */}

        {/* Error/Success Messages */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              borderRadius: '8px'
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{
              mt: 2,
              borderRadius: '8px'
            }}
          >
            {success}
          </Alert>
        )}
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, file: null })}
      >
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          <FilePreview file={previewDialog.file} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, file: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default BulkUpload 