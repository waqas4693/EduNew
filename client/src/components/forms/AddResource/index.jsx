import { useState, useEffect } from 'react'
import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material'
import { getData, postFormData, putFormData } from '../../../api/api'
import MediaViewer from '../../MediaViewer'
import FileUploader from './components/FileUploader'
import ExternalLinks from './components/ExternalLinks'
import MCQForm from './components/MCQForm'
import useResourceForm from './hooks/useResourceForm'
import {
  RESOURCE_TYPES,
  getFileAcceptTypes,
  validateResource,
  processResourceContent
} from './utils/resourceHelpers'

const getResourceKey = (resource, index) => resource._id || `draft-${index}-${resource.number}`

const formatResourceWithUrls = async (resource) => {
  const content = { ...resource.content }

  if (content.fileName) {
    const fileResponse = await getData(
      `resources/files/url/${resource.resourceType}/${content.fileName}`
    )
    content.fileUrl = fileResponse.data.signedUrl
  }
  if (content.backgroundImage) {
    const bgResponse = await getData(
      `resources/files/url/BACKGROUNDS/${content.backgroundImage}`
    )
    content.backgroundImageUrl = bgResponse.data.signedUrl
  }
  if (content.mcq?.imageFile) {
    const mcqImgResponse = await getData(
      `resources/files/url/MCQ_IMAGES/${content.mcq.imageFile}`
    )
    content.mcq.imageFileUrl = mcqImgResponse.data.signedUrl
  }
  if (content.mcq?.audioFile) {
    const mcqAudioResponse = await getData(
      `resources/files/url/MCQ_AUDIO/${content.mcq.audioFile}`
    )
    content.mcq.audioFileUrl = mcqAudioResponse.data.signedUrl
  }

  return {
    ...resource,
    content: processResourceContent(content, resource.resourceType)
  }
}

const AddResource = ({ courseId: propsCourseId, editMode, builderMode = false, onNotify }) => {
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [resourcesLoaded, setResourcesLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedKey, setExpandedKey] = useState(null)
  const [mediaViewer, setMediaViewer] = useState({
    open: false,
    url: '',
    type: '',
    title: ''
  })

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
    handleContentChange
  } = useResourceForm()

  useEffect(() => {
    if ((editMode || builderMode) && propsCourseId) {
      setCourseId(propsCourseId)
    }
  }, [editMode, builderMode, propsCourseId])

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

  const fetchUnits = async () => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units || [])
      }
    } catch (fetchError) {
      console.error('Error fetching units:', fetchError)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections || [])
      }
    } catch (fetchError) {
      console.error('Error fetching sections:', fetchError)
    }
  }

  const loadResources = async () => {
    if (!sectionId) return

    setIsLoading(true)
    setError('')

    try {
      const response = await getData(`resources/${sectionId}?page=1&limit=200`)
      if (response.status === 200) {
        const formatted = await Promise.all(
          (response.data.resources || []).map(formatResourceWithUrls)
        )
        setResources(formatted)
        setResourcesLoaded(true)
        setExpandedKey(null)
        onNotify?.(`Loaded ${formatted.length} resource(s).`)
      }
    } catch (loadError) {
      console.error('Error loading resources:', loadError)
      setError(loadError?.data?.message || 'Failed to load resources.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSectionState = () => {
    setResources([])
    setResourcesLoaded(false)
    setExpandedIndex(null)
    setError('')
  }

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit)
    setUnitId(unit?._id || null)
    setSelectedSection(null)
    setSectionId(null)
    resetSectionState()
  }

  const handleSectionSelect = (section) => {
    setSelectedSection(section)
    setSectionId(section?._id || null)
    resetSectionState()
  }

  const handleAddResource = async () => {
    if (!sectionId) {
      setError('Please select a section first.')
      return
    }

    let nextNumber = null
    try {
      const response = await getData(`resources/latest-number/${sectionId}`)
      nextNumber = response.data?.nextNumber
    } catch {
      nextNumber = null
    }

    addResource(nextNumber)
    setResourcesLoaded(true)
    setExpandedKey('__new__')
  }

  const buildResourceFormData = (resource, { includeSection = false, sectionIdValue } = {}) => {
    const cleanContent = {
      ...resource.content,
      file: undefined,
      backgroundImage: undefined,
      audioFile: undefined,
      fileUrl: undefined,
      backgroundImageUrl: undefined,
      mcq: resource.content.mcq
        ? {
            ...resource.content.mcq,
            imageFile: undefined,
            audioFile: undefined,
            imageFileUrl: undefined,
            audioFileUrl: undefined
          }
        : null
    }

    const formData = new FormData()
    formData.append('name', resource.name)
    formData.append('resourceType', resource.resourceType)
    formData.append('content', JSON.stringify(cleanContent))

    if (includeSection) {
      formData.append('number', resource.number)
      formData.append('sectionId', sectionIdValue)
    }

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

    return formData
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsUploading(true)
    setError('')

    try {
      if (!sectionId) {
        setError('Please select a section')
        return
      }

      if (!resources.length) {
        setError('Add at least one resource before saving.')
        return
      }

      const validationErrors = resources.flatMap((resource) => validateResource(resource))
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'))
        return
      }

      const uploadConfig = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        }
      }

      const existingResources = resources.filter((resource) => resource._id)
      const newResources = resources.filter((resource) => !resource._id)

      await Promise.all(
        existingResources.map((resource) =>
          putFormData(`resources/${resource._id}`, buildResourceFormData(resource), uploadConfig)
        )
      )

      await Promise.all(
        newResources.map((resource) =>
          postFormData(
            'resources',
            buildResourceFormData(resource, {
              includeSection: true,
              sectionIdValue: sectionId
            }),
            uploadConfig
          )
        )
      )

      onNotify?.('Resources saved successfully.')
      await loadResources()
    } catch (submitError) {
      console.error('Error saving resources:', submitError)
      setError(submitError?.data?.message || 'Error saving resources.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleViewMedia = (resource) => {
    let mediaUrl = ''
    let type = resource.resourceType

    if (['VIDEO', 'AUDIO', 'IMAGE', 'PDF', 'PPT'].includes(resource.resourceType)) {
      mediaUrl = resource.content.fileUrl
    } else if (resource.resourceType === 'MCQ') {
      if (resource.content.mcq?.imageFileUrl) {
        mediaUrl = resource.content.mcq.imageFileUrl
        type = 'IMAGE'
      } else if (resource.content.mcq?.audioFileUrl) {
        mediaUrl = resource.content.mcq.audioFileUrl
        type = 'AUDIO'
      }
    }

    if (mediaUrl) {
      setMediaViewer({ open: true, url: mediaUrl, type, title: resource.name })
    }
  }

  const renderResourceEditor = (resource, index) => (
    <Box sx={{ p: 2, bgcolor: 'rgba(245, 248, 251, 0.9)', borderTop: '1px solid rgba(10, 37, 64, 0.08)' }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          size="small"
          label="Resource name"
          value={resource.name}
          onChange={(event) => handleFormChange(index, 'name', event.target.value)}
          required
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Autocomplete
          sx={{ flex: 1, minWidth: 200 }}
          size="small"
          options={RESOURCE_TYPES}
          getOptionLabel={(option) => option.label}
          value={RESOURCE_TYPES.find((type) => type.value === resource.resourceType) || null}
          onChange={(_, newValue) => handleFormChange(index, 'resourceType', newValue?.value || '')}
          disabled={!!resource._id}
          renderInput={(params) => <TextField {...params} label="Resource type" required />}
        />
      </Box>

      {resource.resourceType && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['VIDEO', 'AUDIO', 'IMAGE', 'PDF', 'PPT'].includes(resource.resourceType) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <FileUploader
                label={`Choose ${resource.resourceType}`}
                value={resource.content.file}
                accept={getFileAcceptTypes(resource.resourceType)}
                onChange={(file) => handleContentChange(index, 'file', file)}
                editMode={!!resource._id}
                existingFile={resource.content.fileName}
                onView={() => handleViewMedia(resource)}
              />
              {(resource.resourceType === 'AUDIO' || resource.resourceType === 'PPT') && (
                <FileUploader
                  label="Choose background"
                  value={resource.content.backgroundImage}
                  accept="image/*"
                  onChange={(file) => handleContentChange(index, 'backgroundImage', file)}
                  editMode={!!resource._id}
                  existingFile={resource.content.backgroundImage}
                  type="secondary"
                  onView={() => handleViewMedia(resource)}
                />
              )}
              {resource.resourceType === 'PDF' && (
                <FileUploader
                  label="Choose audio"
                  value={resource.content.audioFile}
                  accept="audio/*"
                  onChange={(file) => handleContentChange(index, 'audioFile', file)}
                  editMode={!!resource._id}
                  existingFile={resource.content.audioFile}
                  type="secondary"
                  onView={() => handleViewMedia(resource)}
                />
              )}
            </Box>
          )}

          {resource.resourceType === 'PDF' && (
            <TextField
              size="small"
              type="number"
              label="Audio repeat count"
              value={resource.content.audioRepeatCount || 1}
              onChange={(event) =>
                handleContentChange(index, 'audioRepeatCount', parseInt(event.target.value, 10))
              }
              slotProps={{ input: { min: 1, max: 11 } }}
              sx={{ maxWidth: 200 }}
            />
          )}

          {resource.resourceType === 'MCQ' && (
            <MCQForm
              content={resource.content}
              onChange={(field, value) => handleContentChange(index, field, value)}
              editMode={!!resource._id}
            />
          )}

          {resource.resourceType === 'TEXT' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FileUploader
                label="Choose background"
                value={resource.content.backgroundImage}
                accept="image/*"
                onChange={(file) => handleContentChange(index, 'backgroundImage', file)}
                editMode={!!resource._id}
                existingFile={resource.content.backgroundImage}
                type="secondary"
                onView={() => handleViewMedia(resource)}
              />
              {(resource.content.questions || []).map((question, questionIndex) => (
                <Box key={questionIndex} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Question ${questionIndex + 1}`}
                    value={question.question}
                    onChange={(event) => {
                      const newQuestions = [...resource.content.questions]
                      newQuestions[questionIndex] = {
                        ...newQuestions[questionIndex],
                        question: event.target.value
                      }
                      handleContentChange(index, 'questions', newQuestions)
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={`Answer ${questionIndex + 1}`}
                    value={question.answer}
                    onChange={(event) => {
                      const newQuestions = [...resource.content.questions]
                      newQuestions[questionIndex] = {
                        ...newQuestions[questionIndex],
                        answer: event.target.value
                      }
                      handleContentChange(index, 'questions', newQuestions)
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          <ExternalLinks
            links={resource.content.externalLinks}
            onChange={(newLinks) => handleContentChange(index, 'externalLinks', newLinks)}
          />
        </Box>
      )}
    </Box>
  )

  const sortedResources = [...resources].sort((a, b) => (a.number || 0) - (b.number || 0))

  return (
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
          <Autocomplete
            options={units}
            value={selectedUnit}
            getOptionLabel={(option) => option?.name || ''}
            onChange={(_, newValue) => handleUnitSelect(newValue)}
            disabled={!courseId}
            sx={{ flex: 1, minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Unit" size="small" required />}
          />
          <Autocomplete
            options={sections}
            value={selectedSection}
            getOptionLabel={(option) => option?.name || ''}
            onChange={(_, newValue) => handleSectionSelect(newValue)}
            disabled={!unitId}
            sx={{ flex: 1, minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Section" size="small" required />}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        {sectionId && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={loadResources}
              disabled={isLoading}
              sx={{ borderRadius: '8px' }}
            >
              {isLoading ? 'Loading…' : 'Load resources'}
            </Button>
            <Button
              startIcon={<AddIcon />}
              size="small"
              variant="contained"
              onClick={handleAddResource}
              sx={{ borderRadius: '8px' }}
            >
              Add resource
            </Button>
          </Box>
        )}

        <Paper
          variant="outlined"
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            borderColor: 'rgba(10, 37, 64, 0.12)'
          }}
        >
          {!sectionId ? (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Select a unit and section to manage resources.
              </Typography>
            </Box>
          ) : !resourcesLoaded && resources.length === 0 ? (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Click &quot;Load resources&quot; to edit existing items, or &quot;Add resource&quot; to create a new one.
              </Typography>
            </Box>
          ) : sortedResources.length === 0 ? (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No resources in this section yet.
              </Typography>
            </Box>
          ) : (
            sortedResources.map((resource, index) => {
              const resourceIndex = resources.indexOf(resource)
              const resourceKey = getResourceKey(resource, resourceIndex)
              const isExpanded =
                expandedKey === resourceKey ||
                (expandedKey === '__new__' && isNew && index === sortedResources.length - 1)
              const isNew = !resource._id

              return (
                <Box key={resourceKey}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: { xs: 1.5, sm: 2 },
                      py: 1.25,
                      borderBottom: '1px solid rgba(10, 37, 64, 0.08)',
                      bgcolor: index % 2 === 0 ? '#fff' : 'rgba(245, 248, 251, 0.7)'
                    }}
                  >
                    <Chip
                      label={resource.number || index + 1}
                      size="small"
                      sx={{
                        minWidth: 40,
                        fontWeight: 700,
                        bgcolor: 'rgba(31, 126, 194, 0.12)',
                        color: 'primary.dark'
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                        {resource.name || (isNew ? 'New resource' : 'Unnamed resource')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {resource.resourceType || 'Type not selected'}
                        {isNew ? ' · Draft' : ''}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={() => setExpandedKey(isExpanded ? null : resourceKey)}
                      aria-label={isExpanded ? 'Collapse resource' : 'Edit resource'}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {isExpanded && renderResourceEditor(resource, resourceIndex)}
                </Box>
              )
            })
          )}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={!sectionId || !resources.length}
            sx={{ borderRadius: '8px', minWidth: 140 }}
          >
            Save resources
          </Button>
        </Box>
      </Box>

      <MediaViewer
        open={mediaViewer.open}
        onClose={() => setMediaViewer({ ...mediaViewer, open: false })}
        url={mediaViewer.url}
        type={mediaViewer.type}
        title={mediaViewer.title}
      />

      {isUploading && (
        <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Box sx={{ width: '50%', maxWidth: 420 }}>
            <Typography variant="h6" color="inherit" align="center">
              Uploading…
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2, height: 8 }} />
          </Box>
        </Backdrop>
      )}
    </>
  )
}

export default AddResource
