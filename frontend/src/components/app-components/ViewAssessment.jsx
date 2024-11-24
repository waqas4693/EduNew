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
import { getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'

const AssessmentRenderer = ({
  assessment,
  signedUrl,
  attemptData,
  onAnswerChange,
  onSubmit
}) => {
  switch (assessment.assessmentType) {
    case 'QNA':
      return (
        <Box sx={{ p: 3 }}>
          <form onSubmit={onSubmit}>
            {assessment.content.questions.map((q, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Question {index + 1}: {q.question}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={attemptData?.answers?.[index]?.answer || ''}
                  onChange={e =>
                    onAnswerChange('answers', index, e.target.value)
                  }
                  placeholder='Enter your answer here'
                  sx={{ mt: 1 }}
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
      return (
        <Box sx={{ p: 3 }}>
          <form onSubmit={onSubmit}>
            {assessment.content.mcqs.map((mcq, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Question {index + 1}: {mcq.question}
                </Typography>
                <RadioGroup
                  value={attemptData?.mcqAnswers?.[index]?.selectedOption || ''}
                  onChange={e =>
                    onAnswerChange('mcqAnswers', index, e.target.value)
                  }
                >
                  {mcq.options.map((option, optIndex) => (
                    <FormControlLabel
                      key={optIndex}
                      value={option}
                      control={<Radio />}
                      label={`${String.fromCharCode(65 + optIndex)}. ${option}`}
                    />
                  ))}
                </RadioGroup>
              </Box>
            ))}
            <Button variant='contained' type='submit' sx={{ mt: 2 }} fullWidth>
              Submit Assessment
            </Button>
          </form>
        </Box>
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
    <Grid
      sx={{
        height: '100%',
        width: '100%',
        p: 3
      }}
    >
      <Grid
        item
        xs={12}
        sx={{
          height: '100%',
          minHeight: 'calc(100vh - 100px)'
        }}
      >
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ mb: 2, p: 2 }}>
            <Typography
              variant='body2'
              sx={{ color: 'primary.main', cursor: 'pointer' }}
              onClick={() => navigate(`/units/${courseId}/section/${unitId}`)}
            >
              &lt; Back To Section
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant='h6'>
                {assessments[currentIndex]?.assessmentType} Assessment
              </Typography>
              <Typography variant='body2'>
                Total Marks: {assessments[currentIndex]?.totalMarks} |
                Percentage: {assessments[currentIndex]?.percentage}%
              </Typography>
            </Box>
            <Typography>
              {currentIndex + 1}/{assessments.length}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              position: 'relative'
            }}
          >
            {assessments[currentIndex] && (
              <AssessmentRenderer
                assessment={assessments[currentIndex]}
                signedUrl={
                  signedUrls[assessments[currentIndex].content.assessmentFile]
                }
                attemptData={attemptData}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmit}
              />
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              borderTop: '1px solid rgba(0, 0, 0, 0.12)'
            }}
          >
            <IconButton onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={currentIndex === assessments.length - 1}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default ViewAssessment
