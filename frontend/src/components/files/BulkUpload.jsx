import { useState, useRef } from 'react'
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
  LinearProgress
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  Folder as FolderIcon
} from '@mui/icons-material'
import { postData } from '../../api/api'

const BulkUpload = () => {
  const [configFile, setConfigFile] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [parsedConfig, setParsedConfig] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [uploading, setUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState('')
  const [overallProgress, setOverallProgress] = useState(0)
  const [fileProgress, setFileProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const folderInputRef = useRef(null)

  const parseConfigFile = async (file) => {
    try {
      const content = await file.text()
      const lines = content.split('\n').map(line => line.trim())
      let currentSection = null
      const config = []

      for (const line of lines) {
        if (!line) continue

        if (line.startsWith('[') && line.endsWith(']')) {
          currentSection = line.slice(1, -1)
        } else if (currentSection && line.includes('|')) {
          const [filename, type] = line.split('|')
          config.push({
            section: currentSection,
            filename: filename.trim(),
            type: type.trim()
          })
        }
      }

      return config
    } catch (error) {
      throw new Error('Failed to parse config file')
    }
  }

  const validateFiles = async (folderHandle, config) => {
    const errors = []
    const validFiles = []

    for (const entry of config) {
      try {
        // Try to get file from folder
        const fileHandle = await folderHandle.getFileHandle(entry.filename)
        const file = await fileHandle.getFile()
        validFiles.push({
          ...entry,
          file
        })
      } catch (error) {
        errors.push(`File not found: ${entry.filename}`)
      }
    }

    return { errors, validFiles }
  }

  const handleConfigFileChange = async (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'text/plain') {
      setConfigFile(file)
      try {
        const config = await parseConfigFile(file)
        setParsedConfig(config)
        setError('')
      } catch (err) {
        setError('Invalid config file format')
        setConfigFile(null)
      }
    } else {
      setError('Please upload a valid text file for configuration')
    }
  }

  const handleFolderSelect = async () => {
    try {
      // Show folder picker
      const handle = await window.showDirectoryPicker()
      setSelectedFolder(handle)

      if (parsedConfig) {
        const { errors, validFiles } = await validateFiles(handle, parsedConfig)
        if (errors.length > 0) {
          setValidationErrors(errors)
        } else {
          setValidationErrors([])
          // Store valid files for upload
          setParsedConfig(validFiles)
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError('Error accessing folder')
      }
    }
  }

  const uploadFiles = async () => {
    if (!parsedConfig || parsedConfig.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')
    
    let completed = 0
    const total = parsedConfig.length

    for (const fileConfig of parsedConfig) {
      try {
        setCurrentFile(fileConfig.filename)
        setFileProgress(0)

        const formData = new FormData()
        formData.append('file', fileConfig.file)
        formData.append('section', fileConfig.section)
        formData.append('type', fileConfig.type)

        await postData('resources/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            setFileProgress(progress)
          }
        })

        completed++
        setOverallProgress((completed / total) * 100)
      } catch (error) {
        setError(`Failed to upload ${fileConfig.filename}`)
        break
      }
    }

    setUploading(false)
    if (completed === total) {
      setSuccess('All files uploaded successfully!')
      // Reset states
      setConfigFile(null)
      setSelectedFolder(null)
      setParsedConfig(null)
      setCurrentFile('')
      setOverallProgress(0)
      setFileProgress(0)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Bulk Resource Upload</Typography>
      
      <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        {/* Config File Section */}
        <Typography variant="h6" sx={{ mb: 2 }}>Step 1: Upload Configuration File</Typography>
        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            accept=".txt"
            onChange={handleConfigFileChange}
            style={{ display: 'none' }}
            id="config-file-input"
          />
          <label htmlFor="config-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FileIcon />}
              sx={{ mr: 2 }}
            >
              Select Config File
            </Button>
          </label>
          {configFile && (
            <Typography variant="body2" color="text.secondary">
              Selected: {configFile.name}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Folder Selection Section */}
        <Typography variant="h6" sx={{ mb: 2 }}>Step 2: Select Resources Folder</Typography>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleFolderSelect}
            startIcon={<FolderIcon />}
            disabled={!parsedConfig}
          >
            Select Folder
          </Button>
          {selectedFolder && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Folder selected: {selectedFolder.name}
            </Typography>
          )}
        </Box>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Validation Errors:</Typography>
            <List dense>
              {validationErrors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          variant="contained"
          onClick={uploadFiles}
          disabled={uploading || !selectedFolder || validationErrors.length > 0}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Start Upload'}
        </Button>
      </Paper>
    </Box>
  )
}

export default BulkUpload 