import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import { MoreVert as MoreVertIcon } from '@mui/icons-material'
import { getData, patchData } from '../../api/api'

const CourseStudents = () => {
  const { id } = useParams()
  const [courseName, setCourseName] = useState('')
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  const [dialogTitle, setDialogTitle] = useState('')

  useEffect(() => {
    fetchCourseStudents()
  }, [id])

  const fetchCourseStudents = async () => {
    try {
      const response = await getData(`student/course/${id}`)
      if (response.status === 200) {
        const { courseName, students } = response.data.data
        setCourseName(courseName)
        setStudents(students || [])
      }
    } catch (error) {
      console.error('Error fetching course students:', error)
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

  const handleRemoveStudent = async () => {
    try {
      if (selectedStudent) {
        const response = await patchData(
          `courses/${id}/remove-student/${selectedStudent._id}`
        )
        if (response.status === 200) {
          fetchCourseStudents()
          setDialogTitle('Success')
          setDialogMessage('Student removed from course successfully')
          setOpenDialog(true)
        }
      }
      handleMenuClose()
    } catch (error) {
      console.error('Error removing student:', error)
      setDialogTitle('Error')
      setDialogMessage('Error removing student from course')
      setOpenDialog(true)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
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

  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: '20px', borderRadius: '16px' }}>
        <Box
          sx={{
            mb: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
              {courseName}
            </Typography>
            <Typography 
              variant='subtitle2' 
              sx={{ 
                color: 'text.secondary',
                mt: 0.5 
              }}
            >
              Total Enrolled: {students.length} students
            </Typography>
          </Box>
          <TextField
            placeholder='Search'
            size='small'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Contact Number</TableCell>
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
                      <Typography>{student.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.contactNo}</TableCell>
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
          <MenuItem onClick={handleRemoveStudent}>Remove from Course</MenuItem>
        </Menu>
      </Paper>

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
    </Box>
  )
}

export default CourseStudents 