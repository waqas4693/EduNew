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
  Grid,
  RadioGroup,
  Radio,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material'
import { 
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  Download as DownloadIcon 
} from '@mui/icons-material'
import { getData, patchData, postData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import url from '../config/server-url'

const AssessmentReview = () => {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openGradeDialog, setOpenGradeDialog] = useState(false)
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [marks, setMarks] = useState('')
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false)
  const [openDecisionDialog, setOpenDecisionDialog] = useState(false)
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false)
  const [feedbackFile, setFeedbackFile] = useState(null)
  const [decision, setDecision] = useState('')
  const [comments, setComments] = useState('')

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const response = await getData(`assessment-review/submitted?role=${user.role}`)
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

  const handleGrade = (attempt) => {
    if (attempt) {
      setSelectedAttempt(attempt)
    }
    setOpenReviewDialog(false)
    setOpenGradeDialog(true)
  }

  const handleSubmitGrade = async () => {
    try {
      if (!marks || marks < 0 || marks > selectedAttempt?.assessmentId?.totalMarks) {
        // Add error handling/notification here
        return
      }

      const response = await patchData(`assessment-review/grade/${selectedAttempt._id}`, {
        obtainedMarks: Number(marks),
        userId: user.id
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

  const handleStatusUpdate = async (attemptId, newStatus) => {
    try {
      await patchData(`assessment-review/status/${attemptId}`, {
        status: newStatus,
        comments: `Status updated to ${newStatus}`,
        userId: user.id
      })
      fetchAssessments()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleFeedbackUpload = async () => {
    if (!feedbackFile || !selectedAttempt) return

    const formData = new FormData()
    formData.append('feedbackFile', feedbackFile)
    formData.append('userId', user.id)

    try {
      const response = await postData(
        `assessment-review/feedback/${selectedAttempt._id}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data' // Important for file upload
          }
        }
      )

      if (response.status === 200) {
        setOpenFeedbackDialog(false)
        setFeedbackFile(null)
        fetchAssessments()
      }
    } catch (error) {
      console.error('Error uploading feedback:', error)
    }
  }

  const handleDecisionSubmit = async () => {
    if (!selectedAttempt || !decision) return

    try {
      const endpoint = user.role === 4 ? 'moderate' : 'verify'
      await postData(`assessment-review/${endpoint}/${selectedAttempt._id}`, {
        status: decision,
        comments,
        userId: user.id
      })
      setOpenDecisionDialog(false)
      setDecision('')
      setComments('')
      fetchAssessments()
    } catch (error) {
      console.error('Error submitting decision:', error)
    }
  }

  const renderHistoryItem = (history, index) => {
    const isDecision = history.decision !== undefined
    const getDecisionColor = (decision) => {
      if (!decision) return 'text.secondary'
      return decision === 'SATISFIED' ? 'success.main' : 'error.main'
    }

    return (
      <Box key={index} sx={{ mb: 2 }}>
        <Typography variant="subtitle1">
          {history.status}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          By: {history.changedBy?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(history.timestamp).toLocaleString()}
        </Typography>
        {isDecision && (
          <Typography variant="body2" color={getDecisionColor(history.decision)} sx={{ mt: 1 }}>
            Decision: {history.decision}
          </Typography>
        )}
        {history.comments && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Comments: {history.comments}
          </Typography>
        )}
        {index !== selectedAttempt.statusHistory.length - 1 && (
          <Divider sx={{ mt: 2 }} />
        )}
      </Box>
    )
  }

  const renderActionButtons = (attempt) => {
    switch (user.role) {
      case 3: // Assessor
        return (
          <Stack direction="row" spacing={1}>
            {attempt.status === 'SUBMITTED' && (
              <Button 
                variant="outlined" 
                onClick={() => handleStatusUpdate(attempt._id, 'PLAGIARISM_CHECK')}
              >
                Start Plagiarism Check
              </Button>
            )}
            {attempt.status === 'PLAGIARISM_CHECK' && (
              <Button 
                variant="outlined" 
                onClick={() => handleStatusUpdate(attempt._id, 'MARKING')}
              >
                Start Marking
              </Button>
            )}
            {(attempt.status === 'MARKING' || attempt.status === 'MARKING_REVISION') && (
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined"
                  onClick={() => handleGrade(attempt)}
                >
                  {attempt.obtainedMarks ? 'Update Grade' : 'Grade Assessment'}
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => {
                    setSelectedAttempt(attempt)
                    setOpenFeedbackDialog(true)
                  }}
                  disabled={!attempt.obtainedMarks}
                >
                  {attempt.status === 'MARKING_REVISION' ? 'Re-upload Feedback' : 'Upload Feedback'}
                </Button>
                {attempt.feedbackFile && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `${url}resources/files/ASSESSMENT_FEEDBACK/${attempt.feedbackFile}`
                      link.download = attempt.feedbackFile
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    Download Feedback
                  </Button>
                )}
                {attempt.obtainedMarks && attempt.feedbackFile && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleStatusUpdate(attempt._id, 'MARKED')}
                  >
                    Submit for Moderation
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        )

      case 4: // Moderator
        return (
          <Stack direction="row" spacing={1}>
            <Stack>
              {attempt.verifierDecision?.status === 'NOT_SATISFIED' && (
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                  Verifier Comments: {attempt.verifierDecision.comments}
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined"
                  onClick={() => {
                    setSelectedAttempt(attempt)
                    setOpenDecisionDialog(true)
                  }}
                >
                  Moderate
                </Button>
                {attempt.feedbackFile && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `${url}resources/files/ASSESSMENT_FEEDBACK/${attempt.feedbackFile}`
                      link.download = attempt.feedbackFile
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    Download Feedback
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        )

      case 5: // Verifier
        return (
          <Stack direction="row" spacing={1}>
            <Stack>
              {attempt.moderatorDecision?.status && (
                <Typography variant="body2" color="info.main" sx={{ mb: 1 }}>
                  Moderator Comments: {attempt.moderatorDecision.comments}
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined"
                  onClick={() => {
                    setSelectedAttempt(attempt)
                    setOpenDecisionDialog(true)
                  }}
                >
                  Verify
                </Button>
                {attempt.feedbackFile && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = `${url}resources/files/ASSESSMENT_FEEDBACK/${attempt.feedbackFile}`
                      link.download = attempt.feedbackFile
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    Download Feedback
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        )

      default:
        return null
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

  const getFileUrl = (fileName, isSubmission = false) => {
    if (!fileName) return ''
    const folder = isSubmission ? 'ASSESSMENT_SUBMISSIONS' : 'ASSESSMENT_FILES'
    return `${url}resources/files/${folder}/${fileName}`
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
              href={getFileUrl(content.submittedFile, true)}
              target="_blank"
              sx={{
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Download Submitted File
            </Button>
          </Box>
        )}

        {/* Assessment File (if it exists) */}
        {selectedAttempt?.assessmentId?.content?.assessmentFile && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Assessment File
            </Typography>
            <Button 
              variant="outlined" 
              href={getFileUrl(selectedAttempt.assessmentId.content.assessmentFile, false)}
              target="_blank"
              sx={{
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Download Assessment File
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
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Assessor</TableCell>
                <TableCell>Moderator</TableCell>
                <TableCell>Verifier</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((attempt) => (
                  <TableRow key={attempt._id}>
                    <TableCell>{attempt.studentName}</TableCell>
                    <TableCell>{attempt.studentId?.email || 'N/A'}</TableCell>
                    <TableCell>{attempt.assessorName || 'N/A'}</TableCell>
                    <TableCell>{attempt.moderatorName || 'N/A'}</TableCell>
                    <TableCell>{attempt.verifierName || 'N/A'}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.courseId?.name}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {attempt.status}
                        <Tooltip title="View History">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAttempt(attempt)
                              setOpenHistoryDialog(true)
                            }}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(attempt.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {renderActionButtons(attempt)}
                      </Box>
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
        <Dialog open={openGradeDialog} onClose={() => {
          setOpenGradeDialog(false)
          setSelectedAttempt(null)
        }}>
          <DialogTitle>Grade Assessment</DialogTitle>
          <DialogContent>
            {selectedAttempt ? (
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
            ) : (
              <Typography>No assessment selected</Typography>
            )}
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
            <Button onClick={() => {
              setOpenGradeDialog(false)
              setSelectedAttempt(null)
            }}>Cancel</Button>
            <Button 
              onClick={handleSubmitGrade} 
              variant="contained"
              disabled={!selectedAttempt}
            >
              Submit Grade
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Upload Dialog */}
        <Dialog open={openFeedbackDialog} onClose={() => setOpenFeedbackDialog(false)}>
          <DialogTitle>Upload Feedback</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files) {
                    setFeedbackFile(e.target.files[0])
                  }
                }}
                style={{ display: 'none' }}
                id="feedback-file-input"
              />
              <label htmlFor="feedback-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Choose File
                </Button>
              </label>
              {feedbackFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {feedbackFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFeedbackDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleFeedbackUpload}
              variant="contained"
              disabled={!feedbackFile}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Decision Dialog */}
        <Dialog open={openDecisionDialog} onClose={() => setOpenDecisionDialog(false)}>
          <DialogTitle>
            {user.role === 4 ? 'Moderation Decision' : 'Verification Decision'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <RadioGroup
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <FormControlLabel 
                  value="SATISFIED" 
                  control={<Radio />} 
                  label="Satisfied" 
                />
                <FormControlLabel 
                  value="NOT_SATISFIED" 
                  control={<Radio />} 
                  label="Not Satisfied" 
                />
              </RadioGroup>
              <TextField
                label="Comments"
                multiline
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDecisionDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleDecisionSubmit}
              variant="contained"
              disabled={!decision}
            >
              Submit Decision
            </Button>
          </DialogActions>
        </Dialog>

        {/* History Dialog */}
        <Dialog 
          open={openHistoryDialog} 
          onClose={() => setOpenHistoryDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Status History</DialogTitle>
          <DialogContent>
            {selectedAttempt?.statusHistory.map((history, index) => renderHistoryItem(history, index))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  )
}

export default AssessmentReview 