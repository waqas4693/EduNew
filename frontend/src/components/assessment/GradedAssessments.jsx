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
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material'
import { getData } from '../../api/api'

const GradedAssessments = () => {
  const [assessments, setAssessments] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const response = await getData('assessment-review/graded')
      if (response.status === 200) {
        setAssessments(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching graded assessments:', error)
    }
  }

  const handleReview = (attempt) => {
    setSelectedAttempt(attempt)
    setOpenReviewDialog(true)
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: '20px', borderRadius: '16px' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Graded Assessments
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Graded Date</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Percentage</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((attempt) => (
                  <TableRow key={attempt._id}>
                    <TableCell>{attempt.studentName}</TableCell>
                    <TableCell>{attempt.studentId?.email || 'N/A'}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.courseId?.name}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.name}</TableCell>
                    <TableCell>
                      {new Date(attempt.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{`${attempt.obtainedMarks}/${attempt.assessmentId.totalMarks}`}</TableCell>
                    <TableCell>{`${Math.round((attempt.obtainedMarks / attempt.assessmentId.totalMarks) * 100)}%`}</TableCell>
                    <TableCell>
                      <Button variant="outlined" onClick={() => handleReview(attempt)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={assessments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
        />

        {/* Review Dialog */}
        <Dialog 
          open={openReviewDialog} 
          onClose={() => setOpenReviewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Assessment Details</DialogTitle>
          <DialogContent dividers>
            {selectedAttempt && (
              <Stack spacing={2}>
                <Typography variant="subtitle1">
                  Student: {selectedAttempt.studentId?.email}
                </Typography>
                <Typography variant="subtitle1">
                  Marks: {selectedAttempt.obtainedMarks}/{selectedAttempt.assessmentId.totalMarks}
                </Typography>
                <Typography variant="subtitle1">
                  Percentage: {Math.round((selectedAttempt.obtainedMarks / selectedAttempt.assessmentId.totalMarks) * 100)}%
                </Typography>
                {/* Add more details as needed */}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  )
}

export default GradedAssessments 