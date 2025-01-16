import { useState, useEffect } from 'react'
import {
  Paper,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { getData, putData } from '../../api/api'

const AssessmentDeadlineSettings = () => {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [intervals, setIntervals] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses')
      setCourses(response.data.data)
      
      const intervalsObj = {}
      response.data.data.forEach(course => {
        intervalsObj[course._id] = course.assessmentInterval || ''
      })
      setIntervals(intervalsObj)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleIntervalChange = (courseId, value) => {
    setIntervals(prev => ({
      ...prev,
      [courseId]: value
    }))
  }

  const handleSaveInterval = async (courseId) => {
    setSaving(prev => ({ ...prev, [courseId]: true }))
    try {
      await putData(`courses/${courseId}`, {
        assessmentInterval: parseInt(intervals[courseId])
      })
    } catch (error) {
      console.error('Error saving interval:', error)
    } finally {
      setSaving(prev => ({ ...prev, [courseId]: false }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Assessment Intervals
        </Typography>
        
        <List>
          {courses.map((course) => (
            <ListItem
              key={course._id}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 2
              }}
            >
              <ListItemText 
                primary={course.name}
                sx={{ flex: '1 1 auto' }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Interval (days)"
                  type="number"
                  size="small"
                  value={intervals[course._id]}
                  onChange={(e) => handleIntervalChange(course._id, e.target.value)}
                  sx={{ width: 150 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSaveInterval(course._id)}
                  disabled={saving[course._id]}
                  size="small"
                >
                  {saving[course._id] ? (
                    <CircularProgress size={20} />
                  ) : 'Save'}
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  )
}

export default AssessmentDeadlineSettings 