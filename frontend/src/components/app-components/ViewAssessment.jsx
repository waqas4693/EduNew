import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ChevronLeft } from '@mui/icons-material'

import { getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import FlagIcon from '@mui/icons-material/Flag'

const AssessmentRenderer = ({
  assessment,
  signedUrl,
  attemptData,
  onAnswerChange,
  onSubmit,
  onPlayAudio
}) => {
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false)
  const [isAssessmentEnded, setIsAssessmentEnded] = useState(false)

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
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

  switch (assessment.assessmentType) {
    case 'QNA':
      return (
        <Box sx={{ p: 2 }}>
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
      if (assessment.isTimeBound && !isAssessmentStarted) {
        return renderTimerOrStartButton()
      }

      if (isAssessmentEnded) {
        return (
          <Box
            sx={{
              textAlign: 'center',
              mt: 4,
              p: 3,
              bgcolor: '#f44336',
              color: 'white',
              borderRadius: '4px'
            }}
          >
            <Typography variant='h4' sx={{ mb: 2 }}>
              Time's Up!
            </Typography>
            <Typography variant='body1'>
              Your assessment has been submitted automatically.
            </Typography>
          </Box>
        )
      }

      const currentMcq = assessment.content.mcqs[currentMcqIndex]
      return (
        <Grid container>
          {renderTimerOrStartButton()}

          {/* MCQ Content Area */}
          <Grid size={10} sx={{ px: '15px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: '10px'
              }}
            >
              <Typography variant='body1'>
                {currentMcqIndex + 1} /{' '}
                {assessment.content.mcqs.length}
              </Typography>
            </Box>

            <Box>
              <Box sx={{ mb: '15px' }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', mb: '10px' }}
                >
                  {currentMcq.question}
                </Typography>

                {currentMcq.audioFile && (
                  <IconButton
                    onClick={() => onPlayAudio(currentMcq.audioFile)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                  >
                    <PlayCircleOutlineIcon />
                  </IconButton>
                )}

                <Box>
                  {currentMcq.options.map((option, optIndex) => (
                    <Box
                      key={optIndex}
                      sx={{
                        px: '10px',
                        mb: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                      onClick={() =>
                        onAnswerChange('mcqAnswers', currentMcqIndex, option)
                      }
                    >
                      <FormControlLabel
                        value={option}
                        control={
                          <Radio
                            checked={
                              attemptData?.mcqAnswers?.[currentMcqIndex]
                                ?.selectedOption === option
                            }
                          />
                        }
                        label={`${String.fromCharCode(
                          65 + optIndex
                        )}. ${option}`}
                      />
                    </Box>
                  ))}
                </Box>

                {/* Navigation Arrows - Moved inside MCQ area */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: '10px',
                  }}
                >
                  <IconButton
                    onClick={handlePreviousMcq}
                    disabled={currentMcqIndex === 0}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: 'grey.300' }
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleNextMcq}
                    disabled={
                      currentMcqIndex === assessment.content.mcqs.length - 1
                    }
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: 'grey.300' }
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                {/* Submit Button - only show on last question */}
                {currentMcqIndex === assessment.content.mcqs.length - 1 && (
                  <Box sx={{ mt: '10px', textAlign: 'center' }}>
                    <Button
                      variant='contained'
                      onClick={onSubmit}
                      sx={{ minWidth: 200 }}
                    >
                      Submit Assessment
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Question List Area */}
          <Grid size={2}>
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mb: 3
                }}
              >
                <Button
                  color='error'
                  onClick={() => toggleFlagQuestion(currentMcqIndex)}
                  variant={
                    flaggedQuestions.has(currentMcqIndex)
                      ? 'contained'
                      : 'outlined'
                  }
                  startIcon={<FlagIcon />}
                  sx={{
                    borderRadius: '4px',
                    '&.MuiButton-contained': {
                      bgcolor: '#f44336',
                      '&:hover': {
                        bgcolor: '#d32f2f'
                      }
                    }
                  }}
                >
                  {flaggedQuestions.has(currentMcqIndex) ? 'Flagged' : 'Flag'}
                </Button>
                {/* <Typography variant='h6'>Questions</Typography> */}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {assessment.content.mcqs.map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => handleSelectMcq(index)}
                    sx={{
                      minWidth: '40px',
                      minHeight: '40px',
                      borderRadius: '4px',
                      ...getQuestionButtonStyle(index)
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      )

    case 'FILE':
      return (
        <Box sx={{ p: 3 }}>
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
                href={assessment.content.supportingFileUrl}
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
        </Box>
      )

    default:
      return <Typography>Unsupported assessment type</Typography>
  }
}

const ViewAssessment = () => {
  const [assessments, setAssessments] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [signedUrls, setSignedUrls] = useState({})
  const [attemptData, setAttemptData] = useState({})
  const [existingAttempt, setExistingAttempt] = useState(null)
  const navigate = useNavigate()
  const { courseId, unitId, sectionId } = useParams()
  const { user } = useAuth()
  const [audioPlayer, setAudioPlayer] = useState(null)
  const [audioUrls, setAudioUrls] = useState({})
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

  const getSignedUrl = async fileName => {
    try {
      const response = await axios.post(`${url}s3/get`, {
        fileName
      })
      return response.data.signedUrl
    } catch (error) {
      console.error('Error fetching signed URL:', error)
      return null
    }
  }

  const getAudioUrl = async fileName => {
    try {
      // Check if URL already exists
      if (audioUrls[fileName]) {
        return audioUrls[fileName]
      }

      // Fetch new URL
      const response = await axios.post(`${url}s3/get`, {
        fileName
      })

      // Store and return URL
      const signedUrl = response.data.signedUrl
      setAudioUrls(prev => ({
        ...prev,
        [fileName]: signedUrl
      }))
      return signedUrl
    } catch (error) {
      console.error('Error fetching audio URL:', error)
      return null
    }
  }

  const handlePlayAudio = async audioFileName => {
    try {
      // Stop current audio if playing
      if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.currentTime = 0
      }

      // Get audio URL
      const audioUrl = await getAudioUrl(audioFileName)
      if (!audioUrl) {
        alert('Error loading audio file')
        return
      }

      // Create and play new audio
      const newPlayer = new Audio(audioUrl)
      newPlayer.play()
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
    const fetchSignedUrl = async () => {
      if (assessments[currentIndex]?.assessmentType === 'FILE') {
        const assessment = assessments[currentIndex]

        if (!signedUrls[assessment.content.assessmentFile]) {
          const signedUrl = await getSignedUrl(
            assessment.content.assessmentFile
          )
          setSignedUrls(prev => ({
            ...prev,
            [assessment.content.assessmentFile]: signedUrl
          }))
        }

        if (
          assessment.content.supportingFile &&
          !signedUrls[assessment.content.supportingFile]
        ) {
          const supportingUrl = await getSignedUrl(
            assessment.content.supportingFile
          )
          setSignedUrls(prev => ({
            ...prev,
            [assessment.content.supportingFile]: supportingUrl
          }))
        }
      }
    }
    fetchSignedUrl()
  }, [currentIndex, assessments])

  useEffect(() => {
    if (assessments[currentIndex]?._id && user?._id) {
      fetchExistingAttempt()
    }
  }, [currentIndex, assessments, user])

  const fetchAssessments = async () => {
    try {
      const response = await getData(`assessments/${sectionId}`)
      if (response.status === 200) {
        setAssessments(response.data.assessments)
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  const fetchExistingAttempt = async () => {
    try {
      const response = await getData(
        `assessment-attempts/${assessments[currentIndex]._id}?studentId=${user._id}`
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

      if (assessments[currentIndex].assessmentType === 'FILE') {
        const formData = new FormData()
        formData.append('file', attemptData.submittedFile)
        const uploadResponse = await axios.post(`${url}s3/upload`, formData)
        finalAttemptData.submittedFile = uploadResponse.data.fileName
      }

      console.log('Student ID:', user.id)

      await axios.post(`${url}assessment-attempts`, {
        assessmentId: assessments[currentIndex]._id,
        studentId: user.id,
        content: finalAttemptData
      })

      alert('Assessment submitted successfully!')
      fetchExistingAttempt()
    } catch (error) {
      console.error('Error submitting assessment:', error)
      alert('Error submitting assessment. Please try again.')
    }
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
                  onClick={() => setSelectedAssessment(assessment)}
                  sx={{
                    py: '3px',
                    px: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    bgcolor:
                      selectedAssessment?._id === assessment._id
                        ? 'action.selected'
                        : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant='subtitle1'>
                    Assessment {index + 1}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Marks: {assessment.totalMarks} | {assessment.percentage}%
                  </Typography>
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
              signedUrl={signedUrls[selectedAssessment.content.assessmentFile]}
              attemptData={attemptData}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmit}
              onPlayAudio={handlePlayAudio}
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
