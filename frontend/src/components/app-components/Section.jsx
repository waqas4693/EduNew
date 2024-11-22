import { useState, useEffect } from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { useNavigate, useParams } from 'react-router-dom'
import Calendar from '../calendar/Calendar'
import Grid from '@mui/material/Grid2'
import { getData } from '../../api/api'

const Section = () => {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])

  const { courseId, unitId } = useParams()

  const handleBackToUnit = () => {
    navigate(`/units/${courseId}`)
  }

  useEffect(() => {
    fetchUnitSections()
  }, [unitId])

  const fetchUnitSections = async () => {
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections)
      }
    } catch (error) {
      console.error('Error fetching unit details:', error)
    }
  }

  return (
    <Grid container spacing={2}>
      {/* Sections Content */}
      <Grid size={7.5}>
        <Paper
          elevation={5}
          sx={{
            p: 3,
            borderRadius: '16px',
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
              }}
              onClick={handleBackToUnit}
            >
              &lt; Back To Unit
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography
              variant='h6'
              sx={{
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              Unit: Understanding roles, responsibilities and relationships in education and training
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#e0e0e0',
              borderRadius: '16px',
              p: 2,
              mb: 3
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 150,
                height: 150,
                mr: 3
              }}
            >
              <svg viewBox="0 0 40 40" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle
                  cx="18"
                  cy="18"
                  r="18"
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="2"
                  strokeDasharray="50, 100"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#673ab7"
                  strokeWidth="2"
                  strokeDasharray="50, 100"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="12"
                  fill="none"
                  stroke="#8bc34a"
                  strokeWidth="2"
                  strokeDasharray="50, 100"
                />
              </svg>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#f44336', borderRadius: '50%', mr: 1 }} />
                <Typography variant='body2'>Total Sections: 4</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#673ab7', borderRadius: '50%', mr: 1 }} />
                <Typography variant='body2'>Completed Sections: 2</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#8bc34a', borderRadius: '50%', mr: 1 }} />
                <Typography variant='body2'>Total Assignments: 10</Typography>
              </Box>
            </Box>
          </Box>

          {sections.map((section) => (
            <Box
              key={section}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                Section {section.name} Length {section.resources.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  sx={{ borderRadius: '8px' }}
                >
                  Assessment
                </Button>
                <Button
                  variant="contained"
                  startIcon={<MenuBookIcon />}
                  sx={{ borderRadius: '8px' }}
                  onClick={() => navigate(`/units/${courseId}/section/${unitId}/learn/${section.id}`)}
                >
                  Learning
                </Button>
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>

      {/* Calendar Section */}
      <Grid size={4.5}>
        <Paper
          elevation={5}
          sx={{
            backgroundColor: 'transparent',
            borderRadius: 2,
            height: 'fit-content'
          }}
        >
          <Calendar />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default Section 