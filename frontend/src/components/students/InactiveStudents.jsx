import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { MoreVert as MoreVertIcon } from '@mui/icons-material'
import { getData, patchData } from '../../api/api'

const InactiveStudents = () => {
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

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await getData('student?status=2')
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

  const handleMakeActive = async () => {
    try {
      if (selectedStudent) {
        const response = await patchData(`student/${selectedStudent._id}/status`, {
          status: 1
        })
        if (response.status === 200) {
          fetchStudents()
          setDialogTitle('Success')
          setDialogMessage('Student marked as active successfully')
          setOpenDialog(true)
        }
      }
      handleMenuClose()
    } catch (error) {
      console.error('Error marking student as active:', error)
      setDialogTitle('Error')
      setDialogMessage('Error marking student as active')
      setOpenDialog(true)
    }
  }

  const handleViewProfile = (student) => {
    navigate(`/admin/students/${student._id}/profile`)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredStudents = students.filter(student =>
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

  return (
    <>
      <Paper elevation={5} sx={{ p: '20px', borderRadius: '16px' }}>
        <Box sx={{ mb: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Inactive Students
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                mt: 0.5 
              }}
            >
              Total Inactive: {students.length} students
            </Typography>
          </Box>
          <TextField
            placeholder="Search"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
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
                <TableCell>Enrolled Courses</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentStudents.map((student) => (
                <TableRow
                  key={student._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography 
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { 
                          color: 'primary.main',
                          textDecoration: 'underline' 
                        } 
                      }}
                      onClick={() => handleViewProfile(student)}
                    >
                      {student.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.contactNo}</TableCell>
                  <TableCell>
                    <List dense sx={{ p: 0, maxHeight: 100, overflowY: 'auto' }}>
                      {student.courses && student.courses.length > 0 ? (
                        student.courses
                          .filter(course => course.courseStatus === 1)
                          .map((course, index) => (
                            <ListItem key={index} sx={{ py: 0 }}>
                              <ListItemText 
                                primary={course.name}
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
                            primary="No courses enrolled"
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
                      onClick={(e) => handleMenuOpen(e, student)}
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
          }}>View Profile</MenuItem>
          <MenuItem onClick={handleMakeActive}>Mark Active</MenuItem>
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
    </>
  )
}

export default InactiveStudents 