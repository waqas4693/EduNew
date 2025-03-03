import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  LinearProgress,
  Autocomplete,
  TextField
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { postData, getData } from '../../api/api'

const BulkUpload = () => {
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [courseId, setCourseId] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [overallProgress, setOverallProgress] = useState(0)
  const [fileProgress, setFileProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New state for section configurations
  const [sectionConfigs, setSectionConfigs] = useState([
    {
      section: null,
      resources: '' // Multiline text for resources
    }
  ])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId) {
      fetchUnits()
    }
  }, [courseId])

  useEffect(() => {
    if (selectedUnit?._id) {
      fetchSections()
    }
  }, [selectedUnit])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
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
      console.error('Error fetching units:', error)
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
      console.error('Error fetching sections:', error)
      setError('Failed to fetch sections')
    }
  }

  const handleFolderSelect = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.webkitdirectory = true
      input.multiple = true

      input.onchange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) {
          setError('No files selected')
          return
        }

        console.log('Selected files:', files)
        const folderName = files[0]?.webkitRelativePath.split('/')[0] || 'Selected Folder'
        
        // Create a map of filenames to files for easier lookup
        const fileMap = new Map()
        files.forEach(file => {
          // Store both the full name and the base name
          fileMap.set(file.name, file) // Store by base name
          fileMap.set(file.webkitRelativePath.split('/').pop(), file) // Store by base name
          fileMap.set(file.webkitRelativePath, file) // Store by full path
        })

        setSelectedFolder({
          name: folderName,
          files: files,
          fileMap: fileMap,
          getFileHandle: async (filename) => {
            // Try to find the file by various name formats
            const file = fileMap.get(filename) || 
                        fileMap.get(`${folderName}/${filename}`) ||
                        files.find(f => f.name === filename || 
                                      f.webkitRelativePath.endsWith(`/${filename}`))

            if (!file) {
              console.error('Available files:', Array.from(fileMap.keys()))
              throw new Error(`File ${filename} not found in folder`)
            }

            return {
              getFile: async () => file
            }
          }
        })
        
        setError('')
        console.log('Folder selected:', folderName)
        console.log('Available files:', Array.from(fileMap.keys()))
      }

      input.click()
    } catch (error) {
      console.error('Folder selection error:', error)
      setError('Error accessing folder: ' + error.message)
    }
  }

  const addSectionConfig = () => {
    setSectionConfigs([...sectionConfigs, { section: null, resources: '' }])
  }

  const removeSectionConfig = (index) => {
    setSectionConfigs(sectionConfigs.filter((_, i) => i !== index))
  }

  const handleSectionConfigChange = (index, field, value) => {
    const newConfigs = [...sectionConfigs]
    newConfigs[index] = { ...newConfigs[index], [field]: value }
    setSectionConfigs(newConfigs)
  }

  const parseResourceText = (text) => {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        const [filename, type] = line.split('|').map(part => part.trim())
        return { filename, type }
      })
      .filter(resource => resource.filename && resource.type)
  }

  const uploadFiles = async () => {
    if (!selectedFolder) {
      setError('Please select a resource folder')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    let totalFiles = 0
    let completed = 0

    // Calculate total files
    sectionConfigs.forEach(config => {
      if (config.section && config.resources) {
        totalFiles += parseResourceText(config.resources).length
      }
    })

    // Process each section
    for (const config of sectionConfigs) {
      if (!config.section || !config.resources) continue

      const resources = parseResourceText(config.resources)
      
      for (const resource of resources) {
        try {
          setCurrentFile(resource.filename)
          setFileProgress(0)

          // Log the file being processed
          console.log('Processing file:', resource.filename)
          console.log('Available files in folder:', selectedFolder.files.map(f => f.name))

          try {
            const fileHandle = await selectedFolder.getFileHandle(resource.filename)
            const file = await fileHandle.getFile()

            const formData = new FormData()
            formData.append('file', file)
            formData.append('sectionId', config.section._id)
            formData.append('type', resource.type)

            await postData('resources/upload', formData, {
              onUploadProgress: (progressEvent) => {
                const progress = (progressEvent.loaded / progressEvent.total) * 100
                setFileProgress(progress)
              }
            })

            completed++
            setOverallProgress((completed / totalFiles) * 100)

            // Clear memory
            formData.delete('file')

            await new Promise(resolve => setTimeout(resolve, 100))

          } catch (error) {
            console.error(`Error processing file ${resource.filename}:`, error)
            setError(`File "${resource.filename}" not found in selected folder. Please check the filename and try again.`)
            continue
          }

        } catch (error) {
          console.error('Upload error:', error)
          setError(`Failed to upload ${resource.filename}: ${error.message}`)
          break
        }
      }
    }

    setUploading(false)
    if (completed === totalFiles) {
      setSuccess('All files uploaded successfully!')
      // Reset states
      setSectionConfigs([{ section: null, resources: '' }])
      setSelectedFolder(null)
      setCurrentFile('')
      setOverallProgress(0)
      setFileProgress(0)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Bulk Resource Upload</Typography>
      
      <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        {/* Course and Unit Selection */}
        <Typography variant="h6" sx={{ mb: 2 }}>Step 1: Select Course and Unit</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Autocomplete
            options={courses}
            value={selectedCourse}
            getOptionLabel={option => option?.name || ''}
            onChange={(_, newValue) => {
              setSelectedCourse(newValue)
              setCourseId(newValue?._id)
              setSelectedUnit(null)
              setSections([])
              setSectionConfigs([{ section: null, resources: '' }])
            }}
            renderInput={params => (
              <TextField {...params} label="Select Course" size="small" required />
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
              setSectionConfigs([{ section: null, resources: '' }])
            }}
            renderInput={params => (
              <TextField {...params} label="Select Unit" size="small" required />
            )}
            sx={{ flex: 1 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section Configurations */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Step 2: Configure Sections and Resources
        </Typography>
        
        {sectionConfigs.map((config, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Autocomplete
                options={sections}
                value={config.section}
                getOptionLabel={option => option?.name || ''}
                onChange={(_, newValue) => {
                  handleSectionConfigChange(index, 'section', newValue)
                }}
                renderInput={params => (
                  <TextField {...params} label="Select Section" size="small" required />
                )}
                sx={{ flex: 1 }}
              />

              {index > 0 && (
                <IconButton
                  onClick={() => removeSectionConfig(index)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              value={config.resources}
              onChange={(e) => handleSectionConfigChange(index, 'resources', e.target.value)}
              placeholder="Enter resources (one per line):&#10;filename.mp4|VIDEO&#10;document.pdf|PDF&#10;image.jpg|IMAGE"
              sx={{ mb: 1 }}
            />
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={addSectionConfig}
          sx={{ mb: 3 }}
        >
          Add Another Section
        </Button>

        <Divider sx={{ my: 3 }} />

        {/* Folder Selection */}
        <Typography variant="h6" sx={{ mb: 2 }}>Step 3: Select Resources Folder</Typography>
        <Button
          variant="outlined"
          onClick={handleFolderSelect}
          startIcon={<FolderIcon />}
        >
          Select Folder
        </Button>
        {selectedFolder && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Folder selected: {selectedFolder.name}
          </Typography>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Uploading: {currentFile}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={fileProgress} 
              sx={{ mb: 2 }} 
            />
            <Typography variant="body2" sx={{ mb: 1 }}>
              Overall Progress: {Math.round(overallProgress)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallProgress} 
            />
          </Box>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          variant="contained"
          onClick={uploadFiles}
          disabled={uploading || !selectedFolder || sectionConfigs.some(config => !config.section || !config.resources)}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          sx={{ mt: 3 }}
        >
          {uploading ? 'Uploading...' : 'Start Upload'}
        </Button>
      </Paper>
    </Box>
  )
}

export default BulkUpload 