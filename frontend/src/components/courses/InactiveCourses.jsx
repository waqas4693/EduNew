import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { getData, patchData } from '../../api/api'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

const InactiveCourses = () => {
  const [courses, setCourses] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [thumbnailUrls, setThumbnailUrls] = useState({})

  useEffect(() => {
    fetchInactiveCourses()
  }, [])

  const fetchInactiveCourses = async () => {
    try {
      const response = await getData('courses/inactive')
      if (response.status === 200) {
        const coursesData = response.data.data
        setCourses(coursesData)
        
        // Fetch thumbnail URLs for all courses
        const urls = {}
        for (const course of coursesData) {
          if (course.thumbnail) {
            try {
              const thumbnailResponse = await getData(`resources/files/url/THUMBNAILS/${course.thumbnail}`)
              if (thumbnailResponse.status === 200) {
                urls[course._id] = thumbnailResponse.data.signedUrl
              }
            } catch (error) {
              console.error('Error fetching thumbnail URL:', error)
            }
          }
        }
        setThumbnailUrls(urls)
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
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
          Inactive Courses
        </Typography>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Enrolled Students</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course) => (
                <TableRow key={course._id}>
                  <TableCell>
                    <Box
                      sx={{
                        width: '100px',
                        height: '60px',
                        bgcolor: course.thumbnail ? 'transparent' : 'primary.light',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {course.thumbnail ? (
                        <img
                          src={thumbnailUrls[course._id]}
                          alt={course.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#e0e0e0'
                          }}
                        >
                          No Image
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.units?.length || 0}</TableCell>
                  <TableCell>
                    <List dense sx={{ p: 0, maxHeight: 100, overflowY: 'auto' }}>
                      {course.enrolledStudents && course.enrolledStudents.length > 0 ? (
                        course.enrolledStudents.map((student, index) => (
                          <ListItem key={index} sx={{ py: 0 }}>
                            <ListItemText 
                              primary={student.name}
                              sx={{
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.875rem',
                                }
                              }}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem sx={{ py: 0 }}>
                          <ListItemText 
                            primary="No enrolled students"
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: '0.875rem',
                                color: 'text.secondary',
                                fontStyle: 'italic'
                              }
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, course)}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.light'
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={courses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-actions': {
              '.MuiIconButton-root': {
                '&.Mui-disabled': {
                  opacity: 0.5
                },
                backgroundColor: 'primary.main',
                color: 'white',
                margin: '0 4px',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }
            }
          }}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkActive} sx={{ color: 'success.main' }}>
          <CheckCircleOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
          Mark Active
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default InactiveCourses 