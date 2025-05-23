import Grid from '@mui/material/Grid2'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CustomDataGrid from '../reusable-components/CustomDataGrid'
import { Tooltip } from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'

import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Box, Chip, Paper, Typography, CircularProgress } from '@mui/material'

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const StudentProgress = () => {
  const { id: studentId, courseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState({
    units: false,
    sections: false,
    resources: false
  })

  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [resources, setResources] = useState([])
  const [courseName, setCourseName] = useState(location.state?.courseName || '')
  const [studentName, setStudentName] = useState(location.state?.studentName || '')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  // Fetch student and course details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!studentName || !courseName) {
          const [studentResponse, courseResponse] = await Promise.all([
            getData(`student/${studentId}`),
            getData(`courses/${courseId}`)
          ])
          setStudentName(studentResponse.data.name)
          setCourseName(courseResponse.data.name)
        }
      } catch (error) {
        console.error('Error fetching details:', error)
      }
    }
    fetchDetails()
  }, [studentId, courseId, studentName, courseName])

  // Fetch units when component mounts
  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(prev => ({ ...prev, units: true }))
      try {
        const response = await getData(`units/${courseId}`)
        const unitsData = response.data.units || []
        setUnits(unitsData)
        
        // Select first unit by default if available
        if (unitsData.length > 0) {
          setSelectedUnit(unitsData[0])
          fetchSections(unitsData[0]._id)
        }
      } catch (error) {
        console.error('Error fetching units:', error)
      } finally {
        setLoading(prev => ({ ...prev, units: false }))
      }
    }
    fetchUnits()
  }, [courseId])

  // Fetch sections for a unit
  const fetchSections = async (unitId) => {
    setLoading(prev => ({ ...prev, sections: true }))
    try {
      const response = await getData(`sections/${unitId}`)
      const sectionsData = response.data.sections || []
      setSections(sectionsData)
      
      // Select first section by default if available
      if (sectionsData.length > 0) {
        setSelectedSection(sectionsData[0])
        handleSectionClick(sectionsData[0])
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
      setSections([])
    } finally {
      setLoading(prev => ({ ...prev, sections: false }))
    }
  }

  // Modified unit click handler
  const handleUnitClick = async unit => {
    setSelectedUnit(unit)
    setSelectedSection(null)
    setResources([])
    await fetchSections(unit._id)
  }

  // Fetch resources when section is selected
  const handleSectionClick = async section => {
    setSelectedSection(section)
    setLoading(prev => ({ ...prev, resources: true }))
    try {
      const response = await getData(
        `student-progress/${studentId}/${courseId}/${selectedUnit._id}/${section._id}`
      )
      setResources(response.data.data || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
      setResources([])
    } finally {
      setLoading(prev => ({ ...prev, resources: false }))
    }
  }

  const columns = [
    {
      field: 'name',
      headerName: 'Resource Name',
      flex: 1,
      minWidth: 200,
      renderCell: params => params.row.name || '-'
    },
    {
      field: 'resourceType',
      headerName: 'Type',
      flex: 0.5,
      renderCell: params => params.row.resourceType || '-'
    },
    {
      field: 'isViewed',
      headerName: 'Status',
      flex: 0.5,
      minWidth: 100,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1
          }}
        >
          {params.row.isViewed ? (
            <CheckCircleIcon sx={{ color: 'success.main' }} />
          ) : (
            <CancelIcon sx={{ color: 'error.main' }} />
          )}
        </Box>
      )
    },
    {
      field: 'viewedAt',
      headerName: 'Viewed At',
      flex: 0.7,
      minWidth: 150,
      renderCell: params => formatDate(params.row.viewedAt)
    }
  ]

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <>
      <Paper
        elevation={5}
        sx={{
          p: 3,
          borderRadius: '16px',
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography
            variant='body2'
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              display: 'inline-flex',
              alignItems: 'center',
              width: 'fit-content',
              gap: 0
            }}
            onClick={handleBackToDashboard}
          >
            <ChevronLeft sx={{ ml: -1 }} /> Back To Dashboard
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1
            }}
          >
            Course Progress
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            Student: <span style={{ fontWeight: 'bold', color: 'text.primary' }}>{studentName}</span>
            <span style={{ mx: 1 }}>•</span>
            Course: <span style={{ fontWeight: 'bold', color: 'text.primary' }}>{courseName}</span>
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={1.5}>
            {selectedUnit && (
              <Box sx={{ pt: '40px' }}>
                {loading.sections ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : sections.length > 0 && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 1,
                      maxHeight: 'calc(100vh - 300px)',
                      overflowY: 'auto',
                      pr: 1
                    }}
                  >
                    {sections.map(section => (
                      <Tooltip 
                        key={section._id} 
                        title={section.name}
                        placement="right"
                      >
                        <Chip
                          label={
                            <Typography
                              sx={{
                                maxWidth: '120px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {section.name}
                            </Typography>
                          }
                          onClick={() => handleSectionClick(section)}
                          color={selectedSection?._id === section._id ? 'primary' : 'default'}
                          sx={{
                            width: '100%',
                            '&:hover': { color: 'white', bgcolor: 'primary.main' }
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Grid>
          <Grid size={9.5}>
            <Box 
              sx={{ 
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#555'
                  }
                }
              }}
            >
              {loading.units ? (
                <CircularProgress size={24} />
              ) : units.length > 0 ? (
                units.map(unit => (
                  <Tooltip 
                    key={unit._id} 
                    title={unit.name}
                    placement="top"
                  >
                    <Chip
                      label={
                        <Typography
                          sx={{
                            maxWidth: '150px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {unit.name}
                        </Typography>
                      }
                      onClick={() => handleUnitClick(unit)}
                      color={selectedUnit?._id === unit._id ? 'primary' : 'default'}
                      sx={{
                        minWidth: 'fit-content',
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                    />
                  </Tooltip>
                ))
              ) : (
                <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
                  <Typography color="text.secondary" variant="h6">
                    No units found in this course
                  </Typography>
                </Box>
              )}
            </Box>
            {selectedSection ? (
              <Box sx={{ pt: '20px', pl: '20px' }}>
                {loading.resources ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <CustomDataGrid
                    rows={resources}
                    columns={columns}
                    hideFooter={false}
                    disableRowSelectionOnClick
                  />
                )}
              </Box>
            ) : selectedUnit && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '300px',
                  width: '100%'
                }}
              >
                <Typography color="text.secondary" variant="h6">
                  There are no sections for the selected unit
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default StudentProgress
