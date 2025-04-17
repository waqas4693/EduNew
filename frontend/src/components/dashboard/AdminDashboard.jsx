import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Menu,
  Paper,
  Tooltip,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'
import EditIcon from '@mui/icons-material/Edit'
import GroupIcon from '@mui/icons-material/Group'
import BlockIcon from '@mui/icons-material/Block'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'

import { useNavigate } from 'react-router-dom'
import { getData, patchData } from '../../api/api'

const getThumbnailUrl = (fileName) => {
  if (!fileName) return ''
  return `${url}resources/files/THUMBNAILS/${fileName}`
}

const AdminCourseCard = ({ course, onMenuOpen }) => {
  const [imageError, setImageError] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailLoading, setThumbnailLoading] = useState(true)

  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (course.thumbnail) {
        try {
          setThumbnailLoading(true)
          const response = await getData(`resources/files/url/THUMBNAILS/${course.thumbnail}`)
          if (response.status === 200) {
            setThumbnailUrl(response.data.signedUrl)
            setImageError(false)
          }
        } catch (error) {
          console.error('Error fetching thumbnail URL:', error)
          setImageError(true)
        } finally {
          setThumbnailLoading(false)
        }
      } else {
        setImageError(true)
        setThumbnailLoading(false)
      }
    }
    fetchThumbnailUrl()
  }, [course.thumbnail])

  return (
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
        onClick={(e) => onMenuOpen(e, course)}
      >
        <MoreVertIcon sx={{ transform: 'rotate(90deg)' }} />
      </IconButton>
      <Box
        sx={{
          width: '100%',
          height: '120px',
          bgcolor: course.thumbnail && !imageError ? 'transparent' : 'primary.light',
          borderRadius: '8px',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {thumbnailLoading ? (
          <CircularProgress size={32} />
        ) : course.thumbnail && !imageError && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.name}
            onError={() => setImageError(true)}
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
      <Tooltip title={course.name}>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {course.name.length > 15 ? `${course.name.substring(0, 10)}...` : course.name}
        </Typography>
      </Tooltip>
      <Typography color="text.secondary" sx={{ fontSize: '12px' }}>
        {course.units?.length || 0} Units
      </Typography>
    </Card>
  )
}

const AdminDashboard = () => {
  const [courses, setCourses] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeCourses: 0,
    activeStudents: 0
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [coursesResponse, statsResponse] = await Promise.all([
        getData('courses'),
        getData('student/stats')
      ])

      if (coursesResponse.status === 200) {
        setCourses(coursesResponse.data.data)
      }

      if (statsResponse.status === 200) {
        setStats(statsResponse.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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

  const handleEdit = () => {
    if (selectedCourse) {
      navigate('/admin/add-course', {
        state: { courseId: selectedCourse._id }
      })
    }
    handleMenuClose()
  }

  const handleViewStudents = () => {
    if (selectedCourse) {
      navigate(`/admin/courses/${selectedCourse._id}/students`)
    }
    handleMenuClose()
  }

  const handleMarkInactive = async () => {
    try {
      if (selectedCourse) {
        const response = await patchData(`courses/${selectedCourse._id}/status`, {
          status: 2
        })

        if (response.status === 200) {
          fetchDashboardData()
          alert('Course marked as inactive successfully')
        }
      }
      handleMenuClose()
    } catch (error) {
      console.error('Error marking course as inactive:', error)
      alert('Error marking course as inactive')
    }
  }

  const StatCard = ({ title, value, icon }) => (
    <Card
      sx={{
        p: 2,
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px',
        bgcolor: 'white',
        boxShadow: '0px 14px 42px 0px #080F340F'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            p: '15px',
            mr: 2,
            borderRadius: '50%',
            bgcolor: '#3366CC1F',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {React.cloneElement(icon, {
            sx: {
              color: '#3366CC',
              fontSize: '24px'
            }
          })}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </Card>
  )

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
        <Grid container spacing={3}>
          {/* Stats Section */}
          <Grid size={3}>
            <StatCard 
              title="Total Courses" 
              value={stats.totalCourses} 
              icon={<MenuBookOutlinedIcon />} 
            />
          </Grid>
          <Grid size={3}>
            <StatCard 
              title="Total Students" 
              value={stats.totalStudents} 
              icon={<GroupOutlinedIcon />} 
            />
          </Grid>
          <Grid size={3}>
            <StatCard 
              title="Total Active Courses" 
              value={stats.activeCourses} 
              icon={<PersonOutlineOutlinedIcon />} 
            />
          </Grid>
          <Grid size={3}>
            <StatCard 
              title="Total Active Students" 
              value={stats.activeStudents} 
              icon={<ArchiveOutlinedIcon />} 
            />
          </Grid>

          {/* Courses Section */}
          <Grid xs={12}>
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              >
                Courses
              </Typography>
              <Grid container spacing={2}>
                {courses.map((course) => (
                  <Grid key={course._id} xs={12} sm={6} md={4} lg={3}>
                    <AdminCourseCard course={course} onMenuOpen={handleMenuOpen} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Menu component remains outside the Paper */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit} sx={{ color: 'primary.main' }}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleViewStudents} sx={{ color: 'info.main' }}>
          <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
          View Students
        </MenuItem>
        <MenuItem onClick={handleMarkInactive} sx={{ color: 'error.main' }}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          Mark In-Active
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AdminDashboard 