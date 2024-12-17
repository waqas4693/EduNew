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
  TextField,
  Stack,
  Divider,
  Grid
} from '@mui/material'
import { getData, patchData } from '../../api/api'

const AssessmentReview = () => {
  const [assessments, setAssessments] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openGradeDialog, setOpenGradeDialog] = useState(false)
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [marks, setMarks] = useState('')

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const response = await getData('assessment-review/submitted')
      if (response.status === 200) {
        setAssessments(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  const handleReview = (attempt) => {
    setSelectedAttempt(attempt)
    setOpenReviewDialog(true)
  }

  const handleGrade = () => {
    setOpenReviewDialog(false)
    setOpenGradeDialog(true)
  }

  const handleSubmitGrade = async () => {
    try {
      const response = await patchData(`assessment-review/grade/${selectedAttempt._id}`, {
        obtainedMarks: Number(marks)
      })
      if (response.status === 200) {
        fetchAssessments()
        setOpenGradeDialog(false)
        setSelectedAttempt(null)
        setMarks('')
      }
    } catch (error) {
      console.error('Error grading assessment:', error)
    }
  }

  const MCQSummary = ({ mcqAnswers = [], mcqs = [] }) => {
    const stats = mcqs.reduce((acc, _, index) => {
      const answer = mcqAnswers[index]
      if (!answer || !answer.selectedOption) {
        acc.unattempted++
      } else if (answer.selectedOption === mcqs[index].correctAnswer) {
        acc.correct++
      } else {
        acc.incorrect++
      }
      return acc
    }, { correct: 0, incorrect: 0, unattempted: 0 })

    return (
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          MCQ Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" color="success.main">
              Correct: {stats.correct}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="error.main">
              Incorrect: {stats.incorrect}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              Unattempted: {stats.unattempted}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    )
  }

  const renderMCQAnswers = (content, originalMCQs) => {
    if (!content?.mcqAnswers || !originalMCQs) return null

    return (
      <Box>
        <MCQSummary 
          mcqAnswers={content.mcqAnswers} 
          mcqs={originalMCQs} 
        />
        
        {originalMCQs.map((mcq, index) => {
          const answer = content.mcqAnswers[index] || {}
          const isCorrect = answer.selectedOption === mcq.correctAnswer
          const isUnattempted = !answer.selectedOption

          return (
            <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Question {index + 1}: {mcq.question}
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                {mcq.options.map((option, optIndex) => {
                  const isSelectedOption = option === answer.selectedOption
                  const isCorrectAnswer = option === mcq.correctAnswer

                  return (
                    <Typography 
                      key={optIndex}
                      variant="body2"
                      sx={{
                        p: 1,
                        mb: 0.5,
                        borderRadius: 1,
                        bgcolor: isCorrectAnswer 
                          ? 'success.light'
                          : isSelectedOption && !isCorrect
                            ? 'error.light'
                            : 'transparent',
                        color: (isCorrectAnswer || (isSelectedOption && !isCorrect))
                          ? 'white'
                          : 'text.primary'
                      }}
                    >
                      {`${String.fromCharCode(65 + optIndex)}. ${option}`}
                      {isCorrectAnswer && ' ✓'}
                      {isSelectedOption && !isCorrect && ' ✗'}
                    </Typography>
                  )
                })}
              </Box>

              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1,
                  color: isUnattempted 
                    ? 'text.secondary'
                    : isCorrect 
                      ? 'success.main'
                      : 'error.main'
                }}
              >
                {isUnattempted 
                  ? 'Question not attempted'
                  : isCorrect 
                    ? 'Correct Answer'
                    : 'Incorrect Answer'}
              </Typography>
            </Box>
          )
        })}
      </Box>
    )
  }

  const renderAssessmentContent = (content) => {
    return (
      <Stack spacing={3}>
        {/* Text Answers */}
        {content.answers?.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Text Answers
            </Typography>
            {content.answers.map((answer, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Question {index + 1}
                </Typography>
                <Typography>{answer.answer}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Divider />

        {/* MCQ Answers */}
        {content.mcqAnswers?.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Multiple Choice Answers
            </Typography>
            {renderMCQAnswers(content, selectedAttempt.assessmentId.content.mcqs)}
          </Box>
        )}

        {/* File Submission */}
        {content.submittedFile && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Submitted File
            </Typography>
            <Button 
              variant="outlined" 
              href={content.submittedFile} 
              target="_blank"
            >
              View Submitted File
            </Button>
          </Box>
        )}
      </Stack>
    )
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: '20px', borderRadius: '16px' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Assessment Review
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody> 
              {assessments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((attempt) => (
                  <TableRow key={attempt._id}>
                    <TableCell>{attempt.studentId?.email || 'N/A'}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.courseId?.name}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.name}</TableCell>
                    <TableCell>
                      {new Date(attempt.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {attempt.assessmentId.assessmentType === 'MCQ' && 
                        `${attempt.calculatedMarks}/${attempt.totalPossibleMarks} (${attempt.percentage}%)`
                      }
                    </TableCell>
                    <TableCell>{attempt.status}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button variant="outlined" onClick={() => handleReview(attempt)}>
                          Review
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleGrade(attempt)}
                          disabled={attempt.status === 'GRADED'}
                        >
                          Grade
                        </Button>
                      </Stack>
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
          <DialogTitle>
            Review Assessment
          </DialogTitle>
          <DialogContent dividers>
            {selectedAttempt && renderAssessmentContent(selectedAttempt.content)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Close</Button>
            <Button 
              onClick={handleGrade}
              variant="contained"
              disabled={selectedAttempt?.status === 'GRADED'}
            >
              Proceed to Grade
            </Button>
          </DialogActions>
        </Dialog>

        {/* Grade Dialog */}
        <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)}>
          <DialogTitle>Grade Assessment</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Student: {selectedAttempt?.studentId?.name}
              </Typography>
              {selectedAttempt?.assessmentId?.assessmentType === 'MCQ' && (
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Calculated Score: {selectedAttempt?.calculatedMarks}/{selectedAttempt?.totalPossibleMarks} ({selectedAttempt?.percentage}%)
                </Typography>
              )}
            </Box>
            <TextField
              label={`Marks (out of ${selectedAttempt?.totalPossibleMarks || 100})`}
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              fullWidth
              InputProps={{
                inputProps: { 
                  min: 0, 
                  max: selectedAttempt?.totalPossibleMarks || 100 
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenGradeDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitGrade} variant="contained">
              Submit Grade
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  )
}

export default AssessmentReview 