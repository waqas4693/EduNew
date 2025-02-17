import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Autocomplete
} from '@mui/material'
import { getData } from '../../api/api'

const ResourceAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [resourceViews, setResourceViews] = useState([])
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedResourceType, setSelectedResourceType] = useState('')

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [viewsResponse, coursesResponse, studentsResponse] = await Promise.all([
          getData('resource-views/all'),
          getData('courses'),
          getData('students')
        ])

        setResourceViews(viewsResponse.data.data)
        setCourses(coursesResponse.data.data)
        setStudents(studentsResponse.data.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter the resource views based on selected filters
  const filteredViews = resourceViews.filter(view => {
    let matchesCourse = true
    let matchesStudent = true
    let matchesResourceType = true

    if (selectedCourse) {
      matchesCourse = view.courseId._id === selectedCourse
    }
    if (selectedStudent) {
      matchesStudent = view.studentId._id === selectedStudent._id
    }
    if (selectedResourceType) {
      matchesResourceType = view.resourceId.resourceType === selectedResourceType
    }

    return matchesCourse && matchesStudent && matchesResourceType
  })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Resource Analytics</Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Course</InputLabel>
            <Select
              value={selectedCourse}
              label="Course"
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map(course => (
                <MenuItem key={course._id} value={course._id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            sx={{ minWidth: 200 }}
            options={students}
            getOptionLabel={(option) => option.name}
            value={selectedStudent}
            onChange={(_, newValue) => setSelectedStudent(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Student" />
            )}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Resource Type</InputLabel>
            <Select
              value={selectedResourceType}
              label="Resource Type"
              onChange={(e) => setSelectedResourceType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="VIDEO">Video</MenuItem>
              <MenuItem value="IMAGE">Image</MenuItem>
              <MenuItem value="AUDIO">Audio</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="PPT">PPT</MenuItem>
              <MenuItem value="TEXT">Text</MenuItem>
              <MenuItem value="MCQ">MCQ</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Viewed At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredViews.map((view) => (
              <TableRow key={view._id}>
                <TableCell>{view.studentId.name}</TableCell>
                <TableCell>{view.courseId.name}</TableCell>
                <TableCell>{view.unitId.name}</TableCell>
                <TableCell>{view.sectionId.name}</TableCell>
                <TableCell>{view.resourceId.name}</TableCell>
                <TableCell>{view.resourceId.resourceType}</TableCell>
                <TableCell>
                  {new Date(view.viewedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ResourceAnalytics 