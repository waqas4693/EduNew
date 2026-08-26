import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { getData, patchData } from '../../api/api'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PageShell from '../layout/PageShell'

const StudentProfile = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    contactNo: '',
    address: ''
  })
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  useEffect(() => {
    fetchStudentDetails()
  }, [studentId])

  const fetchStudentDetails = async () => {
    try {
      setLoading(true)
      const response = await getData(`student/${studentId}`)
      if (response.status === 200 && response.data.data) {
        const studentData = response.data.data
        setStudent(studentData)
        setProfileData({
          name: studentData.name || '',
          email: studentData.email || '',
          contactNo: studentData.contactNo || '',
          address: studentData.address || ''
        })
      } else {
        setError('Student not found')
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
      setError('Failed to load student details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setError('')
    setSuccess('')
  }

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      
      // Create payload with only fields that are present and valid
      const payload = {
        name: profileData.name,
        email: profileData.email,
        contactNo: profileData.contactNo
      }
      
      // Only include address if it has a value
      if (profileData.address && profileData.address.trim() !== '') {
        payload.address = profileData.address;
      }
      
      const response = await patchData(`student/${studentId}`, payload)
      
      if (response.status === 200) {
        setSuccess('Student profile updated successfully')
        setStudent(prev => ({
          ...prev,
          ...payload
        }))
        setEditMode(false)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update student profile')
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleViewCourses = () => {
    navigate(`/admin/students/${studentId}/courses`)
  }

  const handleOpenStatusDialog = () => {
    setOpenStatusDialog(true)
  }

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false)
  }

  const handleToggleStatus = async () => {
    try {
      setStatusUpdateLoading(true)
      // Toggle status between 1 (active) and 2 (inactive)
      const newStatus = student.status === 1 ? 2 : 1
      
      const response = await patchData(`student/${studentId}/status`, {
        status: newStatus
      })
      
      if (response.status === 200) {
        setSuccess(`Student marked as ${newStatus === 1 ? 'active' : 'inactive'} successfully`)
        setStudent(prev => ({
          ...prev,
          status: newStatus
        }))
        handleCloseStatusDialog()
      }
    } catch (error) {
      setError(error.response?.data?.message || `Failed to update student status`)
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  if (loading && !student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleGoBack}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      <PageShell
        kicker="Students"
        title={student?.name || 'Student profile'}
        subtitle={student?.email}
        actions={
          <Chip 
            label={student?.status === 1 ? 'Active' : 'Inactive'} 
            size="small"
            sx={{
              bgcolor: student?.status === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontWeight: 600
            }}
          />
        }
      >
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>{success}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Button 
            variant="outlined"
            startIcon={student?.status === 1 ? <BlockIcon /> : <CheckCircleIcon />}
            onClick={handleOpenStatusDialog}
            color={student?.status === 1 ? "error" : "success"}
          >
            Mark {student?.status === 1 ? 'Inactive' : 'Active'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<MenuBookIcon />} 
            onClick={handleViewCourses}
          >
            View Courses
          </Button>
          <Button
            variant="contained"
            onClick={() => setEditMode(!editMode)}
            sx={{ boxShadow: 'none' }}
          >
            {editMode ? 'Cancel editing' : 'Edit profile'}
          </Button>
        </Box>

            {!editMode ? (
              // View Mode
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {student?.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Contact Number
                    </Typography>
                    <Typography variant="body1">
                      {student?.contactNo || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {student?.address || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ width: '100%', my: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Enrolled Courses
                  </Typography>
                  <List 
                    dense 
                    sx={{ 
                      maxHeight: 200, 
                      overflowY: 'auto', 
                      bgcolor: 'background.paper',
                      border: '1px solid #eee',
                      borderRadius: 1
                    }}
                  >
                    {student?.courses && student.courses.length > 0 ? (
                      student.courses
                        .filter(course => course.courseStatus === 1)
                        .map((course, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemText 
                              primary={course.name}
                              secondary={`Enrolled: ${new Date(course.enrollmentDate).toLocaleDateString()}`}
                            />
                          </ListItem>
                        ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No courses enrolled" />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            ) : (
              // Edit Mode
              <form>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={profileData.name}
                      onChange={handleProfileChange('name')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      value={profileData.contactNo}
                      onChange={handleProfileChange('contactNo')}
                      required
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={profileData.address}
                      onChange={handleProfileChange('address')}
                      size="small"
                      helperText="Optional field"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleUpdateProfile}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </form>
            )}
      </PageShell>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>
          {student?.status === 1 ? 'Mark Student as Inactive?' : 'Mark Student as Active?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {student?.status === 1 
              ? 'This student will no longer be able to access the platform. Are you sure you want to continue?'
              : 'This will restore the student\'s access to the platform. Are you sure you want to continue?'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button 
            onClick={handleToggleStatus}
            variant="contained" 
            color={student?.status === 1 ? "error" : "success"}
            disabled={statusUpdateLoading}
          >
            {statusUpdateLoading ? <CircularProgress size={24} /> : 
              student?.status === 1 ? 'Mark Inactive' : 'Mark Active'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StudentProfile 