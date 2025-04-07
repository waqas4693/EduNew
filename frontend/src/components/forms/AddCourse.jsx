import axios from 'axios'
import AddUnit from './AddUnit'
import AddSection from './AddSection'
import url from '../config/server-url'
import AddResource from './AddResource'
import AddAssessment from './AddAssessment'

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
import { useState, useEffect } from 'react'
import { postData, getData, putData } from '../../api/api'
import { useLocation, useNavigate } from 'react-router-dom'

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '20px 0' }}>
    {value === index && children}
  </div>
)

const AddCourse = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const editMode = location.state?.courseId ? true : false
  const courseId = location.state?.courseId

  const [name, setName] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [editedData, setEditedData] = useState({
    units: null,
    sections: null,
    resources: null,
    assessments: null
  })

  useEffect(() => {
    if (editMode && courseId) {
      fetchCourseDetails()
    }
  }, [editMode, courseId])

  const fetchCourseDetails = async () => {
    try {
      const response = await getData(`courses/${courseId}`)
      if (response.status === 200) {
        setName(response.data.data.name)
        if (response.data.data.thumbnail) {
          // Get signed URL for thumbnail
          const thumbnailResponse = await getData(`resources/files/url/THUMBNAILS/${response.data.data.thumbnail}`)
          if (thumbnailResponse.status === 200) {
            setThumbnailPreview(thumbnailResponse.data.signedUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error)
      alert('Error fetching course details')
    }
  }

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
        const formData = new FormData()
        formData.append('thumbnail', thumbnail)

        const uploadResponse = await axios.post(`${url}upload/thumbnail`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        thumbnailFileName = uploadResponse.data.fileName
      }

      if (editMode) {
        const response = await putData(`courses/${courseId}`, {
          name,
          thumbnail: thumbnailFileName || undefined
        })

        if (response.status === 200) {
          alert('Course updated successfully')
          navigate('/admin/dashboard')
        }
      } else {
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
      }
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error saving course')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper sx={{ borderRadius: '16px', p: 2 }}>
        <Typography
          variant='h5'
          sx={{ mb: 1, fontWeight: 'bold', fontSize: '24px' }}
        >
          {editMode ? 'Edit Course' : 'Add Course'}
        </Typography>
        <Typography
          variant='body1'
          sx={{ mb: 2, fontSize: '18px', color: '#5B5B5B' }}
        >
          {editMode ? 'Update the course details.' : 'Please provide the details of the course.'}
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
                  height: '36px',
                  bgcolor: editMode ? 'success.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: editMode ? 'success.dark' : 'primary.dark',
                  }
                }}
              >
                {editMode ? 'Edit' : 'Save'}
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
            <AddUnit courseId={courseId} editMode={editMode} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AddSection courseId={courseId} editMode={editMode} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <AddResource courseId={courseId} editMode={editMode} />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <AddAssessment courseId={courseId} editMode={editMode} />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}

export default AddCourse
