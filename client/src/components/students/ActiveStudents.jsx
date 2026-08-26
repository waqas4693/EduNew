import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material'
import { MoreVert as MoreVertIcon } from '@mui/icons-material'
import { getData, patchData } from '../../api/api'
import EditIcon from '@mui/icons-material/Edit'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PageShell from '../layout/PageShell'
import EnrolledCourses from './EnrolledCourses'

const ActiveStudents = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  const [dialogTitle, setDialogTitle] = useState('')
  const [openAssignDialog, setOpenAssignDialog] = useState(false)
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [assignStudent, setAssignStudent] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await getData('student')
      if (response.status === 200) {
        setStudents(response.data.data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    }
  }

  const handleMenuOpen = (event, student) => {
    setAnchorEl(event.currentTarget)
    setSelectedStudent(student)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedStudent(null)
  }

  const handleEdit = () => {
    // Implement edit functionality
    handleMenuClose()
  }

  const handleViewCourses = () => {
    if (selectedStudent) {
      navigate(`/admin/students/${selectedStudent._id}/courses`)
    }
    handleMenuClose()
  }

  const handleMakeInactive = async () => {
    try {
      if (selectedStudent) {
        const response = await patchData(
          `student/${selectedStudent._id}/status`,
          {
            status: 2
          }
        )
        if (response.status === 200) {
          fetchStudents()
          setDialogTitle('Success')
          setDialogMessage('Student marked as inactive successfully')
          setOpenDialog(true)
        }
      }
      handleMenuClose()
    } catch (error) {
      console.error('Error marking student as inactive:', error)
      setDialogTitle('Error')
      setDialogMessage('Error marking student as inactive')
      setOpenDialog(true)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const fetchActiveCourses = async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setAvailableCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleAssignCourse = () => {
    if (selectedStudent) {
      setAssignStudent(selectedStudent)
      fetchActiveCourses()
      setOpenAssignDialog(true)
      handleMenuClose()
    }
  }

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false)
    setSelectedCourseId('')
    setAssignStudent(null)
  }

  const handleCourseSelect = (event) => {
    setSelectedCourseId(event.target.value)
  }

  const handleAssignSubmit = async () => {
    if (!selectedCourseId || !assignStudent) return

    setLoading(true)

    try {
      const response = await patchData(`student/${assignStudent._id}/assign-course`, {
        courseId: selectedCourseId
      })

      if (response.status === 200) {
        setDialogTitle('Success')
        setDialogMessage('Course assigned successfully')
        setOpenDialog(true)
        handleCloseAssignDialog()
        fetchStudents()
      }
    } catch (error) {
      console.error('Error assigning course:', error)
      setDialogTitle('Error')
      setDialogMessage('Error assigning course')
      setOpenDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAssessments = () => {
    if (selectedStudent) {
      navigate(`/admin/students/${selectedStudent._id}/assessments`)
    }
    handleMenuClose()
  }

  const handleViewProfile = (student) => {
    navigate(`/admin/students/${student._id}/profile`)
  }

  return (
    <>
      <PageShell
        kicker="Students"
        title="Active students"
        subtitle={`${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'}`}
        actions={
          <TextField
            placeholder="Search name or email"
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#fff'
              }
            }}
          />
        }
      >
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Contact Number</TableCell>
                <TableCell>Enrolled Courses</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentStudents.map(student => (
                <TableRow
                  key={student._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={student.avatar}
                        alt={student.name}
                        sx={{ backgroundColor: 'primary.main' }}
                      >
                        {student.name[0]}
                      </Avatar>
                      <Typography 
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: 'secondary.dark',
                          '&:hover': { 
                            color: 'primary.main',
                            textDecoration: 'underline' 
                          } 
                        }}
                        onClick={() => handleViewProfile(student)}
                      >
                        {student.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.contactNo}</TableCell>
                  <TableCell>
                    <EnrolledCourses
                      courses={student.courses}
                      onViewAll={() => navigate(`/admin/students/${student._id}/courses`)}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton
                      onClick={e => handleMenuOpen(e, student)}
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

        {filteredStudents.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No active students found.
          </Typography>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={filteredStudents.length}
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

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleViewProfile(selectedStudent)
            handleMenuClose()
          }} sx={{ color: 'primary.main' }}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            View Profile
          </MenuItem>
          <MenuItem onClick={handleViewCourses} sx={{ color: 'info.main' }}>
            <MenuBookIcon sx={{ mr: 1, fontSize: 20 }} />
            View Courses
          </MenuItem>
          <MenuItem onClick={handleAssignCourse} sx={{ color: 'success.main' }}>
            <AddCircleOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
            Assign Course
          </MenuItem>
          <MenuItem onClick={handleViewAssessments} sx={{ color: 'warning.main' }}>
            <AssessmentIcon sx={{ mr: 1, fontSize: 20 }} />
            View Assessments
          </MenuItem>
          <MenuItem onClick={handleMakeInactive} sx={{ color: 'error.main' }}>
            <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
            Mark Inactive
          </MenuItem>
        </Menu>
      </PageShell>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 300
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAssignDialog}
        onClose={handleCloseAssignDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          Assign Course to {assignStudent?.name || ''}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourseId}
              label="Select Course"
              onChange={handleCourseSelect}
            >
              {availableCourses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseAssignDialog}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignSubmit}
            variant="contained"
            disabled={!selectedCourseId || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ActiveStudents
