import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material'
import { postData } from '../../api/api'
import AddUnit from './AddUnit'
import AddSection from './AddSection'
import AddResource from './AddResource'
import AddAssessment from './AddAssessment'
import axios from 'axios'
import url from '../config/server-url'

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '20px 0' }}>
    {value === index && children}
  </div>
)

const AddCourse = () => {
  const [name, setName] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (!name) {
        alert('Please enter course name')
        return
      }

      let thumbnailFileName = null
      if (thumbnail) {
        const fileExtension = thumbnail.name.split('.').pop()
        thumbnailFileName = `${name}_${Date.now()}.${fileExtension}`

        const { data: { signedUrl } } = await axios.post(url + 's3', {
          fileName: thumbnailFileName,
          fileType: thumbnail.type
        })

        await axios.put(signedUrl, thumbnail, {
          headers: {
            'Content-Type': thumbnail.type
          }
        })
      }

      const response = await postData('courses', {
        name,
        thumbnail: thumbnailFileName
      })

      if (response.status === 201) {
        setName('')
        setThumbnail(null)
        setThumbnailPreview('')
        alert('Course added successfully')
      }
    } catch (error) {
      console.error('Error adding course:', error)
      alert('Error adding course')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper sx={{ borderRadius: '16px', p: 2 }}>
        <Typography
          variant='h5'
          sx={{ mb: 1, fontWeight: 'bold', fontSize: '24px' }}
        >
          Add Course
        </Typography>
        <Typography
          variant='body1'
          sx={{ mb: 2, fontSize: '18px', color: '#5B5B5B' }}
        >
          Please provide the details of the course to be added.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'start' }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size='small'
              label='Course Name'
              value={name}
              onChange={e => setName(e.target.value)}
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
                sx={{ borderRadius: '8px', height: '36px' }}
              >
                Upload Thumbnail
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </Button>
              <Button
                variant='contained'
                onClick={handleSubmit}
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
          </Box>
          
          {thumbnailPreview && (
            <Box
              sx={{
                width: 150,
                height: 100,
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              flexGrow: 1,
              color: '#8F8F8F',
              fontWeight: 'bold',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 'bold'
              }
            }
          }}
        >
          <Tab label="Unit" />
          <Tab label="Section" />
          <Tab label="Learning Material" />
          <Tab label="Assessment" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          <TabPanel value={activeTab} index={0}>
            <AddUnit />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AddSection />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <AddResource />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <AddAssessment />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}

export default AddCourse
