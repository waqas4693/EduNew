import { useState, useEffect } from 'react'
import {
  Box,
  Radio,
  Paper,
  Button,
  TextField,
  Typography,
  IconButton,
  FormControlLabel,
} from '@mui/material'
import { getData } from '../../api/api'
import { ChevronLeft } from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'

import axios from 'axios'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'
import FlagIcon from '@mui/icons-material/Flag'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import LinearProgress from '@mui/material/LinearProgress'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'

const AssessmentRenderer = ({
  assessment,
  signedUrl,
  attemptData,
  onAnswerChange,
  onSubmit,
  onPlayAudio,
  attemptStatus,
  existingAttempt,
  renderSubmittedFile
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0)
  const [isAssessmentEnded, setIsAssessmentEnded] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false)

  const renderAttemptStatus = () => {
    if (!attemptStatus) return null

    const statusStyles = {
      PENDING: { color: '#f57c00', bgcolor: '#fff3e0' },
      SUBMITTED: { color: '#1976d2', bgcolor: '#e3f2fd' },
      GRADED: { color: '#2e7d32', bgcolor: '#e8f5e9' }
    }

    const statusMessages = {
      PENDING: 'Assessment in progress',
      SUBMITTED: 'Assessment submitted and pending review',
      GRADED: `Assessment graded - Score: ${existingAttempt?.obtainedMarks}%`
    }

    return (
      <Box
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 1,
          ...statusStyles[attemptStatus],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 'medium' }}>
          {statusMessages[attemptStatus]}
        </Typography>
      </Box>
    )
  }

  useEffect(() => {
    let timer
    if (isAssessmentStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isAssessmentStarted, timeRemaining])

  if (attemptStatus === 'SUBMITTED' || attemptStatus === 'GRADED') {
    return (
      <Box sx={{ p: 3 }}>
        {renderAttemptStatus()}
        <Typography variant='h6' sx={{ textAlign: 'center', mt: 2 }}>
          You have already completed this assessment.
          {attemptStatus === 'GRADED' &&
            ` Your score is ${existingAttempt?.obtainedMarks}%.`}
        </Typography>
      </Box>
    )
  }

  const handleStartAssessment = () => {
    setIsAssessmentStarted(true)
    setTimeRemaining(assessment.timeAllowed * 60) // Convert minutes to seconds
  }

  const handleTimeUp = () => {
    setIsAssessmentEnded(true)
    onSubmit() // Automatically submit the assessment
  }

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderTimerOrStartButton = () => {
    if (!assessment.isTimeBound) return null

    if (!isAssessmentStarted) {
      return (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Time Allowed: {assessment.timeAllowed} minutes
          </Typography>
          <Button
            variant='contained'
            color='primary'
            onClick={handleStartAssessment}
            sx={{ minWidth: 200 }}
          >
            Start Assessment
          </Button>
        </Box>
      )
    }

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          bgcolor: timeRemaining <= 300 ? '#f44336' : 'primary.main', // Red when ≤ 5 minutes
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          boxShadow: 3
        }}
      >
        <Typography variant='h6'>
          Time Remaining: {formatTime(timeRemaining)}
        </Typography>
      </Box>
    )
  }

  const handleNextMcq = () => {
    if (currentMcqIndex < assessment.content.mcqs.length - 1) {
      setCurrentMcqIndex(prev => prev + 1)
    }
  }

  const handlePreviousMcq = () => {
    if (currentMcqIndex > 0) {
      setCurrentMcqIndex(prev => prev - 1)
    }
  }

  const handleSelectMcq = index => {
    setCurrentMcqIndex(index)
  }

  const isQuestionAttempted = index => {
    return attemptData?.mcqAnswers?.[index]?.selectedOption !== undefined
  }

  const getQuestionButtonStyle = index => {
    if (flaggedQuestions.has(index)) {
      return {
        bgcolor: '#f44336',
        color: 'white',
        '&:hover': {
          bgcolor: '#d32f2f'
        }
      }
    }
    if (index === currentMcqIndex) {
      return {
        bgcolor: '#333333',
        color: 'white',
        '&:hover': {
          bgcolor: '#222222'
        }
      }
    }
    if (isQuestionAttempted(index)) {
      return {
        bgcolor: '#4CAF50',
        color: 'white',
        '&:hover': {
          bgcolor: '#45a049'
        }
      }
    }
    return {
      bgcolor: '#1976d2',
      color: 'white',
      '&:hover': {
        bgcolor: '#1565c0'
      }
    }
  }

  const toggleFlagQuestion = index => {
    setFlaggedQuestions(prev => {
      const newFlagged = new Set(prev)
      if (newFlagged.has(index)) {
        newFlagged.delete(index)
      } else {
        newFlagged.add(index)
      }
      return newFlagged
    })
  }

  const renderMCQContent = () => {
    if (assessment.isTimeBound && !isAssessmentStarted) {
      return (
        <>
          {renderAttemptStatus()}
          {renderTimerOrStartButton()}
        </>
      )
    }

    const currentMcq = assessment.content.mcqs[currentMcqIndex]
    return (
      <Box sx={{ p: 2 }}>
        {/* Timer Bar */}
        {assessment.isTimeBound && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Time limit: {formatTime(timeRemaining)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(timeRemaining / (assessment.duration * 60)) * 100}
              sx={{ height: 8, borderRadius: 2 }}
            />
          </Box>
        )}

        {/* Question Navigation */}
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {assessment.content.mcqs.map((_, index) => (
            <Button
              key={index}
              onClick={() => handleSelectMcq(index)}
              sx={{
                minWidth: '40px',
                height: '40px',
                p: 0,
                borderRadius: '4px',
                border: currentMcqIndex === index ? '2px solid #1976d2' : 'none',
                bgcolor: getQuestionButtonColor(index),
                color: 'white',
                '&:hover': {
                  bgcolor: getQuestionButtonHoverColor(index)
                }
              }}
            >
              {index + 1}
            </Button>
          ))}
        </Box>

        {/* Question Content */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Question {currentMcqIndex + 1} of {assessment.content.mcqs.length}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {currentMcq.question}
            </Typography>
            {currentMcq.audioFile && (
              <IconButton
                onClick={() => onPlayAudio(currentMcq.audioFile)}
                sx={{ color: 'primary.main' }}
              >
                <VolumeUpIcon />
              </IconButton>
            )}
          </Box>

          {/* Options */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentMcq.options.map((option, optIndex) => (
              <Button
                key={optIndex}
                onClick={() => onAnswerChange('mcqAnswers', currentMcqIndex, option)}
                variant={attemptData?.mcqAnswers?.[currentMcqIndex]?.selectedOption === option ? 'contained' : 'outlined'}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: attemptData?.mcqAnswers?.[currentMcqIndex]?.selectedOption === option ? 'primary.main' : 'transparent',
                  color: attemptData?.mcqAnswers?.[currentMcqIndex]?.selectedOption === option ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: attemptData?.mcqAnswers?.[currentMcqIndex]?.selectedOption === option ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                {`${String.fromCharCode(65 + optIndex)}. ${option}`}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handlePreviousMcq}
            disabled={currentMcqIndex === 0}
            startIcon={<ChevronLeftIcon />}
            sx={{ minWidth: 100 }}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => toggleFlagQuestion(currentMcqIndex)}
              startIcon={<FlagIcon />}
              color={flaggedQuestions.has(currentMcqIndex) ? 'warning' : 'primary'}
            >
              {flaggedQuestions.has(currentMcqIndex) ? 'Flagged' : 'Flag'}
            </Button>

            {currentMcqIndex === assessment.content.mcqs.length - 1 && (
              <Button
                variant="contained"
                onClick={onSubmit}
                sx={{ minWidth: 120 }}
              >
                Submit
              </Button>
            )}
          </Box>

          <Button
            onClick={handleNextMcq}
            disabled={currentMcqIndex === assessment.content.mcqs.length - 1}
            endIcon={<ChevronRightIcon />}
            sx={{ minWidth: 100 }}
          >
            Next
          </Button>
        </Box>
      </Box>
    )
  }

  // Helper function for question button colors
  const getQuestionButtonColor = (index) => {
    if (flaggedQuestions.has(index)) return '#ffa726' // Warning/Review color
    if (attemptData?.mcqAnswers?.[index]) return '#4caf50' // Attempted color
    if (currentMcqIndex === index) return '#1976d2' // Current question color
    return '#e0e0e0' // Default color
  }

  const getQuestionButtonHoverColor = (index) => {
    if (flaggedQuestions.has(index)) return '#f57c00'
    if (attemptData?.mcqAnswers?.[index]) return '#388e3c'
    if (currentMcqIndex === index) return '#1565c0'
    return '#bdbdbd'
  }

  switch (assessment.assessmentType) {
    case 'QNA':
      return (
        <Box sx={{ p: 2 }}>
          {renderAttemptStatus()}
          <form onSubmit={onSubmit}>
            {assessment.content.questions.map((q, index) => (
              <Box key={index} sx={{ mb: '15px' }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                  Question {index + 1}: {q.question}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={attemptData?.answers?.[index]?.answer || ''}
                  onChange={e =>
                    onAnswerChange('answers', index, e.target.value)
                  }
                  placeholder='Enter your answer here'
                />
              </Box>
            ))}
            <Button variant='contained' type='submit' sx={{ mt: 2 }} fullWidth>
              Submit Assessment
            </Button>
          </form>
        </Box>
      )

    case 'MCQ':
      return renderMCQContent()

    case 'FILE':
      return (
        <Box sx={{ p: 3 }}>
          {renderAttemptStatus()}
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Assessment File
            </Typography>
            <Button
              variant='contained'
              href={signedUrl}
              target='_blank'
              sx={{ mb: 2 }}
            >
              Download Assessment
            </Button>
          </Box>
          {assessment.content.supportingFile && (
            <Box sx={{ mb: 4 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Supporting Material
              </Typography>
              <Button
                variant='outlined'
                href={signedUrl}
                target='_blank'
              >
                Download Supporting Material
              </Button>
            </Box>
          )}
          <Box sx={{ mt: 4 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Submit Your Solution
            </Typography>
            <input
              type='file'
              onChange={e =>
                onAnswerChange('submittedFile', 0, e.target.files[0])
              }
              style={{ display: 'none' }}
              id='solution-file'
            />
            <label htmlFor='solution-file'>
              <Button variant='outlined' component='span' sx={{ mb: 2 }}>
                Upload Solution File
              </Button>
            </label>
            {attemptData?.submittedFile && (
              <Typography variant='body2' sx={{ ml: 2 }}>
                Selected file: {attemptData.submittedFile.name}
              </Typography>
            )}
            <Button
              variant='contained'
              onClick={onSubmit}
              sx={{ mt: 2 }}
              fullWidth
            >
              Submit Assessment
            </Button>
          </Box>
          {renderSubmittedFile(attemptData?.submittedFile)}
        </Box>
      )

    default:
      return <Typography>Unsupported assessment type</Typography>
  }
}

const ViewAssessment = () => {
  const { user } = useAuth()
  const { courseId, unitId, sectionId } = useParams()

  const navigate = useNavigate()

  const [dueDates, setDueDates] = useState({})
  const [audioUrls, setAudioUrls] = useState({})
  const [signedUrls, setSignedUrls] = useState({})
  const [attemptData, setAttemptData] = useState({})
  const [assessments, setAssessments] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [audioPlayer, setAudioPlayer] = useState(null)
  const [existingAttempt, setExistingAttempt] = useState(null)
  const [selectedAssessment, setSelectedAssessment] = useState(null)

  // Group assessments by type
  const groupedAssessments = assessments.reduce((groups, assessment) => {
    const type = assessment.assessmentType
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(assessment)
    return groups
  }, {})

  const getFileUrl = (fileName, isSubmission = false) => {
    if (!fileName) return null
    const folder = isSubmission ? 'ASSESSMENT_SUBMISSIONS' : 'ASSESSMENT_FILES'
    return `${url}resources/files/${folder}/${fileName}`
  }

  const getAudioUrl = audioFileName => {
    if (!audioFileName) return null
    // Ensure we're using the correct path to access the audio file
    return `${url}resources/files/ASSESSMENT_FILES/${encodeURIComponent(audioFileName)}`
  }

  const handlePlayAudio = async audioFileName => {
    try {
      // Stop current audio if playing
      if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.currentTime = 0
      }

      const audioUrl = getAudioUrl(audioFileName)
      if (!audioUrl) {
        console.error('No audio URL available')
        return
      }

      // Create and play new audio
      const newPlayer = new Audio(audioUrl)
      
      // Add error handling for the audio player
      newPlayer.onerror = (e) => {
        console.error('Error loading audio:', e)
        alert('Error loading audio file')
      }

      // Add loading handler
      newPlayer.oncanplaythrough = () => {
        newPlayer.play().catch(error => {
          console.error('Error playing audio:', error)
          alert('Error playing audio file')
        })
      }

      setAudioPlayer(newPlayer)
    } catch (error) {
      console.error('Error playing audio:', error)
      alert('Error playing audio file')
    }
  }

  // Clean up audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.currentTime = 0
      }
    }
  }, [audioPlayer])

  useEffect(() => {
    fetchAssessments()
  }, [sectionId])

  useEffect(() => {
    const fetchFileUrls = async () => {
      if (assessments[currentIndex]?.assessmentType === 'FILE') {
        const assessment = assessments[currentIndex]

        if (assessment.content.assessmentFile) {
          const fileUrl = getFileUrl(assessment.content.assessmentFile)
          setSignedUrls(prev => ({
            ...prev,
            [assessment.content.assessmentFile]: fileUrl
          }))
        }

        if (assessment.content.supportingFile) {
          const supportingUrl = getFileUrl(assessment.content.supportingFile)
          setSignedUrls(prev => ({
            ...prev,
            [assessment.content.supportingFile]: supportingUrl
          }))
        }
      }
    }
    fetchFileUrls()
  }, [currentIndex, assessments])

  useEffect(() => {
    if (assessments[currentIndex]?._id && user?._id) {
      fetchExistingAttempt()
    }
  }, [currentIndex, assessments, user])

  const calculateDueDate = (enrollmentDate, interval) => {
    const enrollmentDateTime = new Date(enrollmentDate)
    return new Date(
      enrollmentDateTime.getTime() + interval * 24 * 60 * 60 * 1000
    )
  }

  const getAssessmentStatus = dueDate => {
    const now = new Date()
    const dueDateObj = new Date(dueDate)
    const diffDays = Math.ceil((dueDateObj - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: 'Overdue', color: 'error.light' }
    if (diffDays === 0) return { label: 'Due Today', color: 'warning.light' }
    return { label: `Due in ${diffDays} days`, color: 'info.light' }
  }

  const fetchAssessments = async () => {
    try {
      const response = await getData(
        `assessments/${sectionId}?studentId=${user.studentId}`
      )
      if (response.status === 200) {
        setAssessments(response.data.assessments)
        
        // Get enrollment date from localStorage
        const enrollmentDates = JSON.parse(localStorage.getItem('enrollmentDates'))
        const courseEnrollmentDate = enrollmentDates[courseId]
        
        if (!courseEnrollmentDate) {
          console.error('Missing enrollment date for course:', courseId)
          return
        }

        // Calculate due dates for each assessment using its own interval
        const datesMap = {}
        response.data.assessments.forEach(assessment => {
          const dueDate = calculateDueDate(
            courseEnrollmentDate,
            assessment.interval
          )
          datesMap[assessment._id] = dueDate
        })
        setDueDates(datesMap)
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  const fetchExistingAttempt = async () => {
    try {
      const response = await getData(
        `assessment-attempts/${assessments[currentIndex]._id}?studentId=${user.studentId}`
      )
      if (response.status === 200 && response.data.attempt) {
        setExistingAttempt(response.data.attempt)
        setAttemptData(response.data.attempt.content)
      }
    } catch (error) {
      console.error('Error fetching attempt:', error)
    }
  }

  const handleNext = () => {
    if (currentIndex < assessments.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleAnswerChange = (type, index, value) => {
    setAttemptData(prev => {
      if (type === 'answers') {
        const answers = [...(prev.answers || [])]
        answers[index] = { questionId: index.toString(), answer: value }
        return { ...prev, answers }
      } else if (type === 'mcqAnswers') {
        const mcqAnswers = [...(prev.mcqAnswers || [])]
        mcqAnswers[index] = { mcqId: index.toString(), selectedOption: value }
        return { ...prev, mcqAnswers }
      } else if (type === 'submittedFile') {
        return { ...prev, submittedFile: value }
      }
      return prev
    })
  }

  const handleSubmit = async e => {
    e?.preventDefault()
    try {
      let finalAttemptData = { ...attemptData }

      if (selectedAssessment?.assessmentType === 'FILE' && attemptData.submittedFile) {
        // Check if submittedFile exists and is a File object
        if (!(attemptData.submittedFile instanceof File)) {
          throw new Error('Please select a file to submit')
        }

        const formData = new FormData()
        formData.append('file', attemptData.submittedFile)
        
        try {
          // Upload the file first
          const uploadResponse = await axios.post(
            `${url}upload/file?type=SUBMISSION`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          )
          
          // Set only the filename in the finalAttemptData
          finalAttemptData = {
            submittedFile: uploadResponse.data.fileName
          }
        } catch (error) {
          console.error('Error uploading file:', error)
          throw new Error('Failed to upload file. Please try again.')
        }
      }

      // Submit the assessment attempt with the file name
      const response = await axios.post(`${url}assessment-attempts`, {
        assessmentId: selectedAssessment._id,
        studentId: user.studentId,
        content: finalAttemptData
      })

      if (response.status === 201) {
        alert('Assessment submitted successfully!')
        fetchExistingAttempt()
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      alert(error.message || 'Error submitting assessment. Please try again.')
    }
  }

  const handleSelectAssessment = assessment => {
    const attempt = assessment.attempt
    if (
      attempt &&
      (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED')
    ) {
      setSelectedAssessment(assessment)
      setAttemptData(attempt.content)
      setExistingAttempt(attempt)
    } else if (!attempt) {
      setSelectedAssessment(assessment)
      setAttemptData({})
      setExistingAttempt(null)
    }
  }

  // Update the AssessmentRenderer to handle submission files
  const renderSubmittedFile = (fileName) => {
    if (!fileName) return null
    const fileUrl = getFileUrl(fileName, true) // true indicates it's a submission
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Submitted File:</Typography>
        <Button
          variant="outlined"
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 1 }}
        >
          Download Submitted File
        </Button>
      </Box>
    )
  }

  return (
    <Paper
      elevation={5}
      sx={{
        display: 'flex',
        borderRadius: '16px',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography
          variant='body2'
          sx={{
            color: 'primary.main',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content'
          }}
          onClick={() => navigate(`/units/${courseId}/section/${unitId}`)}
        >
          <ChevronLeft sx={{ color: 'primary.main' }} /> Back To Section
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', height: 'calc(100% - 48px)' }}>
        {/* Assessment List Sidebar */}
        <Box
          sx={{
            width: '300px',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            overflow: 'auto'
          }}
        >
          {Object.entries(groupedAssessments).map(([type, typeAssessments]) => (
            <Box key={type} sx={{ mb: 2 }}>
              <Typography
                variant='body1'
                sx={{
                  p: '10px',
                  color: 'white',
                  bgcolor: 'primary.main'
                }}
              >
                {type} Assessments
              </Typography>
              {typeAssessments.map((assessment, index) => (
                <Box
                  key={assessment._id}
                  onClick={() => handleSelectAssessment(assessment)}
                  sx={{
                    py: '3px',
                    px: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    bgcolor:
                      selectedAssessment?._id === assessment._id
                        ? 'action.selected'
                        : 'transparent',
                    opacity:
                      assessment.attempt?.status === 'SUBMITTED' ||
                      assessment.attempt?.status === 'GRADED'
                        ? 0.7
                        : 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant='subtitle1'>
                    Assessment {index + 1}
                    {assessment.attempt?.status && (
                      <Box
                        component='span'
                        sx={{
                          ml: 1,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          bgcolor:
                            assessment.attempt.status === 'SUBMITTED'
                              ? 'info.light'
                              : 'success.light'
                        }}
                      >
                        {assessment.attempt.status}
                      </Box>
                    )}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Marks: {assessment.totalMarks} | Section Weightage: {assessment.percentage}%
                  </Typography>
                  {dueDates[assessment._id] && !assessment.attempt?.status && (
                    <Typography
                      variant='body2'
                      sx={{
                        color: getAssessmentStatus(dueDates[assessment._id])
                          .color,
                        fontWeight: 500
                      }}
                    >
                      {getAssessmentStatus(dueDates[assessment._id]).label}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        {/* Assessment Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto'
          }}
        >
          {selectedAssessment ? (
            <AssessmentRenderer
              assessment={selectedAssessment}
              signedUrl={
                selectedAssessment.assessmentType === 'FILE'
                  ? getFileUrl(selectedAssessment.content.assessmentFile)
                  : null
              }
              attemptData={attemptData}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmit}
              onPlayAudio={handlePlayAudio}
              attemptStatus={existingAttempt?.status}
              existingAttempt={existingAttempt}
              renderSubmittedFile={renderSubmittedFile}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <Typography variant='h6' color='text.secondary'>
                Select an assessment to begin
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  )
}

export default ViewAssessment
