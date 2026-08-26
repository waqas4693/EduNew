import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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
import { getData, postData, postFormData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Grid from '@mui/material/Grid2'
import FlagIcon from '@mui/icons-material/Flag'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import LinearProgress from '@mui/material/LinearProgress'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import {
  LayoutChromeNavButtons,
  LayoutChromePaletteButton,
  useClaimLayoutChrome
} from '../layout/LayoutChrome'

const AssessmentRenderer = ({
  assessment,
  assessmentFileUrl,
  supportingFileUrl,
  attemptData,
  onAnswerChange,
  onSubmit,
  onPlayAudio,
  attemptStatus,
  existingAttempt,
  renderSubmittedFile,
  mcqImageUrls
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
    return attemptData?.mcqAnswers?.[index]?.selectedOptions?.length > 0
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

  const handleMCQOptionToggle = (mcqIndex, option) => {
    // Get current MCQ answers from attemptData
    const currentMcqAnswers = attemptData?.mcqAnswers?.[mcqIndex]?.selectedOptions || []
    const isSelected = currentMcqAnswers.includes(option)

    if (isSelected) {
      // Remove option if already selected
      const updatedSelectedOptions = currentMcqAnswers.filter(opt => opt !== option)
      onAnswerChange('mcqAnswers', mcqIndex, updatedSelectedOptions)
    } else {
      // Add option if not selected
      const updatedSelectedOptions = [...currentMcqAnswers, option]
      onAnswerChange('mcqAnswers', mcqIndex, updatedSelectedOptions)
    }
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
          
          {/* Question Text and Media */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {currentMcq.question}
            </Typography>
            
            {/* MCQ Image */}
            {currentMcq.imageFile && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <img
                  src={mcqImageUrls[currentMcq.imageFile]}
                  alt="Question Image"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                  onError={(e) => {
                    console.error('Error loading MCQ image:', e)
                    e.target.style.display = 'none'
                  }}
                />
              </Box>
            )}
            
            {/* MCQ Audio */}
            {currentMcq.audioFile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton
                  onClick={() => onPlayAudio(currentMcq.audioFile)}
                  sx={{ color: 'primary.main' }}
                >
                  <VolumeUpIcon />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Audio available
                </Typography>
              </Box>
            )}
          </Box>

          {/* Multiple Answer Instructions */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="body2" color="info.contrastText">
              <strong>Instructions:</strong> This question has {currentMcq.numberOfCorrectAnswers} correct answer{currentMcq.numberOfCorrectAnswers > 1 ? 's' : ''}. 
              Select all correct options.
            </Typography>
          </Box>

          {/* Options */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentMcq.options.map((option, optIndex) => {
              const isSelected = attemptData?.mcqAnswers?.[currentMcqIndex]?.selectedOptions?.includes(option) || false
              return (
                <Button
                  key={optIndex}
                  onClick={() => handleMCQOptionToggle(currentMcqIndex, option)}
                  variant={isSelected ? 'contained' : 'outlined'}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    p: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: isSelected ? 'primary.main' : 'transparent',
                    color: isSelected ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  {`${String.fromCharCode(65 + optIndex)}. ${option}`}
                </Button>
              )
            })}
          </Box>

          {/* Selected Answers Summary */}
          {attemptData?.mcqAnswers?.[currentMcqIndex]?.selectedOptions && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
              <Typography variant="body2" color="success.contrastText">
                <strong>Selected:</strong> {attemptData.mcqAnswers[currentMcqIndex].selectedOptions.join(', ')}
                {' '}({attemptData.mcqAnswers[currentMcqIndex].selectedOptions.length}/{currentMcq.numberOfCorrectAnswers})
              </Typography>
            </Box>
          )}
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
    if (attemptData?.mcqAnswers?.[index]?.selectedOptions?.length > 0) return '#4caf50' // Attempted color
    if (currentMcqIndex === index) return '#1976d2' // Current question color
    return '#e0e0e0' // Default color
  }

  const getQuestionButtonHoverColor = (index) => {
    if (flaggedQuestions.has(index)) return '#f57c00'
    if (attemptData?.mcqAnswers?.[index]?.selectedOptions?.length > 0) return '#388e3c'
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
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {renderAttemptStatus()}
          <Box
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: '12px',
              bgcolor: 'rgba(31, 126, 194, 0.06)'
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 1.5, color: 'secondary.dark' }}>
              Assessment files
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Button
                variant="contained"
                href={assessmentFileUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!assessmentFileUrl}
                sx={{ borderRadius: '8px', boxShadow: 'none' }}
              >
                {assessmentFileUrl ? 'Download assessment' : 'Loading file…'}
              </Button>
              {assessment.content.supportingFile && (
                <Button
                  variant="outlined"
                  href={supportingFileUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={!supportingFileUrl}
                  sx={{ borderRadius: '8px' }}
                >
                  {supportingFileUrl ? 'Download supporting material' : 'Loading file…'}
                </Button>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: '1px solid rgba(10, 37, 64, 0.08)'
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 1.5, color: 'secondary.dark' }}>
              Submit your solution
            </Typography>
            <input
              type="file"
              onChange={e =>
                onAnswerChange('submittedFile', 0, e.target.files[0])
              }
              style={{ display: 'none' }}
              id="solution-file"
            />
            <label htmlFor="solution-file">
              <Button variant="outlined" component="span" sx={{ mb: 1.5, borderRadius: '8px' }}>
                Choose solution file
              </Button>
            </label>
            {attemptData?.submittedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selected:{' '}
                {attemptData.submittedFile.name || String(attemptData.submittedFile)}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={onSubmit}
              fullWidth
              sx={{ borderRadius: '8px', boxShadow: 'none' }}
            >
              Submit assessment
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
  const { courseId, sectionId } = useParams()
  useClaimLayoutChrome()

  const [dueDates, setDueDates] = useState({})
  const [audioUrls, setAudioUrls] = useState({})
  const [signedUrls, setSignedUrls] = useState({})
  const [attemptData, setAttemptData] = useState({})
  const [assessments, setAssessments] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mcqImageUrls, setMcqImageUrls] = useState({})
  const [mcqAudioUrls, setMcqAudioUrls] = useState({})
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

  const getSignedFileUrl = async (fileName, folder) => {
    if (!fileName) return null
    try {
      const response = await getData(`resources/files/url/${folder}/${fileName}`)
      return response.data.signedUrl
    } catch (error) {
      console.error(`Error getting signed URL for ${folder}/${fileName}:`, error)
      return null
    }
  }

  const getMCQImageUrl = async (imageFile) => {
    return getSignedFileUrl(imageFile, 'MCQ_IMAGES')
  }

  const getMCQAudioUrl = async (audioFile) => {
    return getSignedFileUrl(audioFile, 'MCQ_AUDIO')
  }

  const fetchMCQImageUrls = async (mcqs) => {
    const imageUrls = {}
    for (const mcq of mcqs) {
      if (mcq.imageFile) {
        const signedUrl = await getMCQImageUrl(mcq.imageFile)
        if (signedUrl) {
          imageUrls[mcq.imageFile] = signedUrl
        }
      }
    }
    setMcqImageUrls(imageUrls)
  }

  const fetchMCQAudioUrls = async (mcqs) => {
    const audioUrls = {}
    for (const mcq of mcqs) {
      if (mcq.audioFile) {
        const signedUrl = await getMCQAudioUrl(mcq.audioFile)
        if (signedUrl) {
          audioUrls[mcq.audioFile] = signedUrl
        }
      }
    }
    setMcqAudioUrls(audioUrls)
  }

  const handlePlayAudio = async audioFileName => {
    try {
      // Stop current audio if playing
      if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.currentTime = 0
      }

      // Use the cached audio URL if available, otherwise fetch it
      let audioUrl = mcqAudioUrls[audioFileName]
      if (!audioUrl) {
        audioUrl = await getMCQAudioUrl(audioFileName)
        if (audioUrl) {
          setMcqAudioUrls(prev => ({
            ...prev,
            [audioFileName]: audioUrl
          }))
        }
      }

      if (!audioUrl) {
        console.error('No audio URL available')
        alert('Audio file not available')
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
      const assessment = selectedAssessment
      if (!assessment || assessment.assessmentType !== 'FILE') return

      const nextUrls = {}

      if (assessment.content?.assessmentFile) {
        nextUrls[assessment.content.assessmentFile] = await getSignedFileUrl(
          assessment.content.assessmentFile,
          'ASSESSMENT_FILES'
        )
      }

      if (assessment.content?.supportingFile) {
        nextUrls[assessment.content.supportingFile] = await getSignedFileUrl(
          assessment.content.supportingFile,
          'ASSESSMENT_FILES'
        )
      }

      setSignedUrls(prev => ({ ...prev, ...nextUrls }))
    }

    fetchFileUrls()
  }, [selectedAssessment])

  useEffect(() => {
    if (assessments[currentIndex]?._id && user?.studentId) {
      fetchExistingAttempt()
    }
  }, [currentIndex, assessments, user])

  const startOfDay = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    date.setHours(0, 0, 0, 0)
    return date
  }

  const calculateDueDate = (enrollmentDate, interval, createdAt) => {
    const enrollment = startOfDay(enrollmentDate)
    const created = startOfDay(createdAt)
    if (!enrollment && !created) return null

    const baseTime = Math.max(
      enrollment?.getTime() || 0,
      created?.getTime() || 0
    )

    return new Date(baseTime + Number(interval || 0) * 24 * 60 * 60 * 1000)
  }

  const formatDueDate = (dueDate) =>
    new Date(dueDate).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

  const getAssessmentStatus = dueDate => {
    const due = startOfDay(dueDate)
    const today = startOfDay(new Date())
    if (!due || !today) {
      return { label: 'Due date unavailable', color: 'text.secondary' }
    }

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        label: `Overdue · was due ${formatDueDate(due)}`,
        color: 'error.main'
      }
    }
    if (diffDays === 0) {
      return { label: `Due today · ${formatDueDate(due)}`, color: 'warning.main' }
    }
    return {
      label: `Due in ${diffDays} days · ${formatDueDate(due)}`,
      color: 'info.main'
    }
  }

  const resolveEnrollmentDate = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('enrollmentDates') || '{}')
      const fromStorage = stored[String(courseId)]
      if (fromStorage) return fromStorage
    } catch (error) {
      console.error('Error reading enrollment dates:', error)
    }

    const fromUser = user?.courseIds?.find(
      (course) => String(course.courseId) === String(courseId)
    )
    return fromUser?.enrollmentDate || null
  }

  const fetchAssessments = async () => {
    try {
      const response = await getData(
        `assessments/${sectionId}?studentId=${user.studentId}`
      )
      if (response.status === 200) {
        const list = response.data.assessments || []
        setAssessments(list)

        const courseEnrollmentDate = resolveEnrollmentDate()
        if (!courseEnrollmentDate) {
          console.error('Missing enrollment date for course:', courseId)
          setDueDates({})
          return
        }

        const datesMap = {}
        list.forEach(assessment => {
          const dueDate = calculateDueDate(
            courseEnrollmentDate,
            assessment.interval,
            assessment.createdAt
          )
          if (dueDate) {
            datesMap[assessment._id] = dueDate
          }
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
        mcqAnswers[index] = { 
          mcqId: index.toString(), 
          selectedOptions: Array.isArray(value) ? value : [value]
        }
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
          const uploadResponse = await postFormData('upload/file?type=SUBMISSION', formData)

          finalAttemptData = {
            submittedFile: uploadResponse.data.fileName
          }
        } catch (error) {
          console.error('Error uploading file:', error)
          throw new Error(error.data?.message || 'Failed to upload file. Please try again.')
        }
      }

      const response = await postData('assessment-attempts', {
        assessmentId: selectedAssessment._id,
        studentId: user.studentId,
        content: finalAttemptData
      })

      if (response.status === 200 || response.status === 201) {
        alert(
          selectedAssessment?.assessmentType === 'MCQ'
            ? 'Assessment submitted and graded successfully!'
            : 'Assessment submitted successfully!'
        )
        fetchExistingAttempt()
        fetchAssessments()
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
    
    // Fetch MCQ image and audio URLs if assessment has MCQs
    if (assessment.assessmentType === 'MCQ' && assessment.content?.mcqs) {
      fetchMCQImageUrls(assessment.content.mcqs)
      fetchMCQAudioUrls(assessment.content.mcqs)
    }
  }

  const renderSubmittedFile = (fileName) => {
    if (!fileName || fileName instanceof File) return null

    const fileUrl = signedUrls[fileName]
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Submitted file
        </Typography>
        <Button
          variant="outlined"
          href={fileUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!fileUrl}
          sx={{ mt: 1, borderRadius: '8px' }}
          onClick={async (event) => {
            if (fileUrl) return
            event.preventDefault()
            const url = await getSignedFileUrl(fileName, 'ASSESSMENT_SUBMISSIONS')
            if (url) {
              setSignedUrls(prev => ({ ...prev, [fileName]: url }))
              window.open(url, '_blank', 'noopener,noreferrer')
            }
          }}
        >
          {fileUrl ? 'Download submitted file' : 'Prepare download'}
        </Button>
      </Box>
    )
  }

  const typeLabel = {
    MCQ: 'Multiple choice',
    QNA: 'Written answers',
    FILE: 'File upload'
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        borderRadius: '16px',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0px 10px 32px rgba(10, 37, 64, 0.08)',
        minHeight: '70vh'
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          background: 'linear-gradient(135deg, #1F7EC2 0%, #155A8F 55%, #0A2540 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'nowrap'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
          <LayoutChromeNavButtons light />
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 600,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            Assessments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, ml: 'auto' }}>
          <LayoutChromePaletteButton light />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            width: { xs: '100%', md: 320 },
            borderRight: { md: '1px solid rgba(10, 37, 64, 0.08)' },
            borderBottom: { xs: '1px solid rgba(10, 37, 64, 0.08)', md: 'none' },
            overflow: 'auto',
            bgcolor: 'rgba(10, 37, 64, 0.02)',
            maxHeight: { xs: 280, md: 'none' }
          }}
        >
          {assessments.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">No assessments in this section yet.</Typography>
            </Box>
          ) : (
            Object.entries(groupedAssessments).map(([type, typeAssessments]) => (
              <Box key={type} sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    px: 2,
                    py: 1,
                    fontSize: 12,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: 'text.secondary',
                    bgcolor: 'rgba(31, 126, 194, 0.08)'
                  }}
                >
                  {typeLabel[type] || type}
                </Typography>
                {typeAssessments.map((assessment, index) => {
                  const selected = selectedAssessment?._id === assessment._id
                  const status = assessment.attempt?.status
                  const dueStatus =
                    dueDates[assessment._id] && !status
                      ? getAssessmentStatus(dueDates[assessment._id])
                      : null

                  return (
                    <Box
                      key={assessment._id}
                      onClick={() => handleSelectAssessment(assessment)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(10, 37, 64, 0.06)',
                        bgcolor: selected ? 'rgba(31, 126, 194, 0.12)' : 'transparent',
                        borderLeft: selected ? '3px solid #1F7EC2' : '3px solid transparent',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'rgba(31, 126, 194, 0.08)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 600, color: 'secondary.dark', fontSize: 15 }}>
                          Assessment {index + 1}
                        </Typography>
                        {status && (
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: '999px',
                              fontSize: 11,
                              fontWeight: 700,
                              bgcolor:
                                status === 'GRADED'
                                  ? 'rgba(46, 125, 50, 0.12)'
                                  : 'rgba(25, 118, 210, 0.12)',
                              color: status === 'GRADED' ? 'success.dark' : 'info.dark'
                            }}
                          >
                            {status}
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {assessment.totalMarks} marks · {assessment.percentage}% of section
                      </Typography>
                      {dueStatus && (
                        <Typography
                          sx={{
                            mt: 0.5,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: dueStatus.color
                          }}
                        >
                          {dueStatus.label}
                        </Typography>
                      )}
                    </Box>
                  )
                })}
              </Box>
            ))
          )}
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fff' }}>
          {selectedAssessment ? (
            <AssessmentRenderer
              assessment={selectedAssessment}
              assessmentFileUrl={
                signedUrls[selectedAssessment.content?.assessmentFile] || null
              }
              supportingFileUrl={
                signedUrls[selectedAssessment.content?.supportingFile] || null
              }
              mcqImageUrls={mcqImageUrls}
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
                height: '100%',
                minHeight: 280,
                px: 3,
                textAlign: 'center'
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Fraunces", serif',
                    fontWeight: 600,
                    color: 'secondary.dark',
                    mb: 0.75
                  }}
                >
                  Select an assessment
                </Typography>
                <Typography color="text.secondary">
                  Choose one from the list to download files, answer questions, or submit.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  )
}

export default ViewAssessment
