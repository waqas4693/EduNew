import Grid from '@mui/material/Grid2'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CustomDataGrid from '../reusable-components/CustomDataGrid'

import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Box, Chip, Paper, Typography, CircularProgress } from '@mui/material'

const StudentProgress = () => {
  const { id: studentId, courseId } = useParams()
  const location = useLocation()

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
        setUnits(response.data.units || [])
      } catch (error) {
        console.error('Error fetching units:', error)
      } finally {
        setLoading(prev => ({ ...prev, units: false }))
      }
    }
    fetchUnits()
  }, [courseId])

  // Fetch sections when unit is selected
  const handleUnitClick = async unit => {
    setSelectedUnit(unit)
    setSelectedSection(null)
    setResources([])
    setLoading(prev => ({ ...prev, sections: true }))
    try {
      const response = await getData(`sections/${unit._id}`)
      setSections(response.data.sections || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
      setSections([])
    } finally {
      setLoading(prev => ({ ...prev, sections: false }))
    }
  }

  // Fetch resources when section is selected
  const handleSectionClick = async section => {
    setSelectedSection(section)
    setLoading(prev => ({ ...prev, resources: true }))
    try {
      const response = await getData(
        `resources/${section._id}/student/${studentId}/status`
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
      renderCell: params =>
        params.row.viewedAt
    }
  ]

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
                ) : (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {sections.map(section => (
                      <Chip
                        key={section._id}
                        label={section.name}
                        onClick={() => handleSectionClick(section)}
                        color={
                          selectedSection?._id === section._id
                            ? 'primary'
                            : 'default'
                        }
                        sx={{
                          '&:hover': { color: 'white', bgcolor: 'primary.main' }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Grid>
          <Grid size={9.5}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {loading.units ? (
                <CircularProgress size={24} />
              ) : (
                units.map(unit => (
                  <Chip
                    key={unit._id}
                    label={unit.name}
                    onClick={() => handleUnitClick(unit)}
                    color={
                      selectedUnit?._id === unit._id ? 'primary' : 'default'
                    }
                    sx={{
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                  />
                ))
              )}
            </Box>
            {selectedSection && (
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
            )}
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default StudentProgress
