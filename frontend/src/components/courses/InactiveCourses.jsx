import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Paper,
  IconButton,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { getData, patchData } from '../../api/api'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'

const InactiveCourses = () => {
  const [courses, setCourses] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    fetchInactiveCourses()
  }, [])

  const fetchInactiveCourses = async () => {
    try {
      const response = await getData('courses/inactive')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching inactive courses:', error)
    }
  }

  const handleMenuOpen = (event, course) => {
    setAnchorEl(event.currentTarget)
    setSelectedCourse(course)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCourse(null)
  }

  const handleMarkActive = async () => {
    try {
      if (selectedCourse) {
        const response = await patchData(`courses/${selectedCourse._id}/status`, {
          status: 1
        })
        
        if (response.status === 200) {
          fetchInactiveCourses()
          alert('Course marked as active successfully')
        }
      }
      handleMenuClose()
    } catch (error) {
      console.error('Error marking course as active:', error)
      alert('Error marking course as active')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper 
        elevation={5} 
        sx={{ 
          p: 3, 
          borderRadius: '16px',
          backgroundColor: 'white'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          InActive Courses
        </Typography>
        
        <Grid container spacing={2}>
          {courses.map((course) => (
            <Grid key={course._id} size={3}>
              <Card
                sx={{
                  p: 2,
                  height: '100%',
                  width: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  border: '1px solid #3366CC33',
                  position: 'relative',
                  boxShadow: '0px 14px 42px 0px #080F340F',
                  opacity: 0.8,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    cursor: 'pointer'
                  }
                }}
              >
                <IconButton
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                    backgroundColor: 'white',
                    width: '32px',
                    height: '32px',
                    '&:hover': {
                      backgroundColor: 'white',
                      opacity: 0.9
                    },
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={(e) => handleMenuOpen(e, course)}
                >
                  <MoreVertIcon sx={{ transform: 'rotate(90deg)' }} />
                </IconButton>
                <Box
                  sx={{
                    width: '100%',
                    height: '120px',
                    bgcolor: course.thumbnail ? 'transparent' : 'primary.light',
                    borderRadius: '8px',
                    mb: 2
                  }}
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MenuBookOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                  )}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontSize: '14px' }}>
                  {course.name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '12px' }}>
                  {course.units?.length || 0} Units
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkActive}>Mark Active</MenuItem>
      </Menu>
    </Box>
  )
}

export default InactiveCourses 