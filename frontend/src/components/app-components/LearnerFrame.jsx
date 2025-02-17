import url from '../config/server-url'
import Grid from '@mui/material/Grid2'

import { getData, postData } from '../../api/api'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Launch,
  ExpandMore
} from '@mui/icons-material'
import { useAuth } from '../../context/AuthContext'

const formatExternalUrl = url => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

const ResourceRenderer = ({ resource, signedUrl, signedUrls }) => {
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const audioRef = useRef(null)
  const mcqAudioRef = useRef(null)
  const [playCount, setPlayCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (resource.resourceType === 'AUDIO' && audioRef.current) {
      const audio = audioRef.current
      const repeatCount = resource.content.repeatCount

      const handleEnded = () => {
        setPlayCount(prev => {
          const newCount = prev + 1
          if (newCount <= repeatCount) {
            setTimeout(() => {
              audio.currentTime = 0
              audio.play()
            }, 0)
            return newCount
          }
          setIsPlaying(false)
          return 0
        })
      }

      const handlePlay = () => {
        if (!isPlaying) {
          setPlayCount(1)
          setIsPlaying(true)
        }
      }

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('play', handlePlay)

      return () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('play', handlePlay)
      }
    }
  }, [resource, isPlaying])

  const handleAnswerSelect = option => {
    if (hasSubmitted) return

    setSelectedAnswers(prev => {
      const currentAnswers = [...prev]
      const index = currentAnswers.indexOf(option)

      if (
        index === -1 &&
        currentAnswers.length < resource.content.mcq.numberOfCorrectAnswers
      ) {
        return [...currentAnswers, option]
      } else if (index !== -1) {
        return currentAnswers.filter(ans => ans !== option)
      }
      return currentAnswers
    })
  }

  const handleSubmit = () => {
    if (
      selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers
    ) {
      alert(
        `Please select ${resource.content.mcq.numberOfCorrectAnswers} answer(s)`
      )
      return
    }

    const isAnswerCorrect =
      selectedAnswers.length === resource.content.mcq.correctAnswers.length &&
      selectedAnswers.every(answer =>
        resource.content.mcq.correctAnswers.includes(answer)
      )

    setIsCorrect(isAnswerCorrect)
    setHasSubmitted(true)
  }

  const handleReset = () => {
    setSelectedAnswers([])
    setHasSubmitted(false)
    setIsCorrect(false)
  }

  const getOptionStyle = option => {
    if (!hasSubmitted) {
      return {
        border: selectedAnswers.includes(option)
          ? '2px solid #3366CC'
          : '1px solid #ddd'
      }
    }

    const isSelected = selectedAnswers.includes(option)
    const isCorrect = resource.content.mcq.correctAnswers.includes(option)

    if (isSelected && isCorrect) {
      return { bgcolor: '#4CAF50', color: 'white' }
    } else if (isSelected && !isCorrect) {
      return { bgcolor: '#f44336', color: 'white' }
    } else if (!isSelected && isCorrect) {
      return { bgcolor: '#4CAF50', color: 'white' }
    }
    return { border: '1px solid #ddd' }
  }

  const renderMCQ = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
          {resource.content.mcq.question}
        </Typography>

        {/* MCQ Image */}
        {resource.content.mcq?.imageFile && signedUrls[resource.content.mcq.imageFile] && (
          <Box sx={{ mb: 2, maxWidth: '100%', overflow: 'hidden' }}>
            <img
              src={signedUrls[resource.content.mcq.imageFile]}
              alt="Question"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        )}

        {/* MCQ Audio Player */}
        {resource.content.mcq?.audioFile && signedUrls[resource.content.mcq.audioFile] && (
          <Box sx={{ mb: 2 }}>
            <audio
              ref={mcqAudioRef}
              controls
              style={{ width: '100%' }}
              src={signedUrls[resource.content.mcq.audioFile]}
            >
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}

        {/* Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {resource.content.mcq.options.map((option, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                cursor: hasSubmitted ? 'default' : 'pointer',
                bgcolor: hasSubmitted
                  ? resource.content.mcq.correctAnswers.includes(option)
                    ? '#e8f5e9'
                    : selectedAnswers.includes(option)
                    ? '#ffebee'
                    : 'white'
                  : selectedAnswers.includes(option)
                  ? '#e3f2fd'
                  : 'white',
                '&:hover': {
                  bgcolor: hasSubmitted
                    ? resource.content.mcq.correctAnswers.includes(option)
                      ? '#e8f5e9'
                      : selectedAnswers.includes(option)
                      ? '#ffebee'
                      : 'white'
                    : '#f5f5f5'
                }
              }}
              onClick={() => handleAnswerSelect(option)}
            >
              <Typography>{option}</Typography>
            </Paper>
          ))}
        </Box>

        {!hasSubmitted ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers}
          >
            Submit
          </Button>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity={isCorrect ? 'success' : 'error'}>
              {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
            </Alert>
            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          </Box>
        )}
      </Box>
    )
  }

  switch (resource.resourceType) {
    case 'VIDEO':
      return (
        <Box sx={{ position: 'relative', width: '100%', height: '80vh' }}>
          <video
            controls
            controlsList="nodownload"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
            src={signedUrl}
          />
        </Box>
      )

    case 'IMAGE':
      return (
        <Box
          sx={{
            width: '100%',
            height: '70vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <img
            src={signedUrl}
            alt={resource.name}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      )

    case 'TEXT':
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: 3
          }}
        >
          {/* Background Image */}
          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '100%',
                height: '40vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt='Background'
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}

          {/* Questions and Answers */}
          <Box sx={{ width: '100%' }}>
            {resource.content.questions.map((qa, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:before': {
                    display: 'none'
                  },
                  borderRadius: '8px !important',
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    bgcolor: 'grey.200',
                    '& .MuiAccordionSummary-expandIconWrapper': {
                    },
                    '& .MuiAccordionSummary-content': {
                      overflow: 'hidden'
                    }
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {qa.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    backgroundColor: 'background.paper',
                    p: 3
                  }}
                >
                  <Typography
                    variant='body1'
                    sx={{
                      color: 'text.primary',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {qa.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      )

    case 'MCQ':
      return renderMCQ()

    case 'AUDIO':
      return (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              m: 1,
              p: 1,
              display: 'flex',
              bgcolor: '#f5f5f5',
              borderRadius: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2
            }}
          >
            <audio
              controls
              ref={audioRef}
              src={signedUrl}
              style={{ width: '100%', maxWidth: '600px' }}
            />
            {playCount > 0 && (
              <Typography
                variant='body1'
                sx={{
                  color: 'primary.white',
                  fontWeight: 'medium',
                  minWidth: '30px',
                  textAlign: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'primary.light'
                }}
              >
                {resource.content.repeatCount - playCount + 1}
              </Typography>
            )}
          </Box>

          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt={resource.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </Box>
      )

    case 'PPT':
      return (
        <Box
          sx={{
            p: 2,
            gap: 2,
            width: '100%',
            height: '80vh',
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
            style={{
              width: '50%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            title='PowerPoint Presentation'
            allowFullScreen
          />
          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '50%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt="Presentation Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}
        </Box>
      )

    case 'PDF':
      return (
        <Box
          sx={{
            width: '100%',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            title="PDF Viewer"
          />
          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt="Background"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}
        </Box>
      )

    default:
      return (
        <Box
          sx={{
            width: '100%',
            height: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography>Unsupported resource type</Typography>
        </Box>
      )
  }
}

const LearnerFrame = () => {
  const [resources, setResources] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [signedUrls, setSignedUrls] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { courseId, unitId, sectionId } = useParams()
  const { user } = useAuth()
  const [sectionProgress, setSectionProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  const getLocalFileUrl = async (fileName, resourceType) => {
    if (!fileName) return null
    return `${url}resources/files/${resourceType}/${fileName}`
  }

  const fetchAllThumbnails = async () => {
    try {
      const response = await getData(`resources/${sectionId}`)
      if (response.status === 200) {
        // Sort resources by number before setting state
        const sortedResources = response.data.resources.sort((a, b) => a.number - b.number)
        setResources(sortedResources)
        setIsLoading(false)

        // Get signed URLs for all resources
        const urls = {}
        for (const resource of sortedResources) {
          if (resource.content.fileName) {
            const signedUrl = await getLocalFileUrl(
              resource.content.fileName,
              resource.resourceType
            )
            urls[resource.content.fileName] = signedUrl
          }
          if (resource.content.backgroundImage) {
            const signedUrl = await getLocalFileUrl(
              resource.content.backgroundImage,
              'BACKGROUNDS'
            )
            urls[resource.content.backgroundImage] = signedUrl
          }
        }
        setSignedUrls(urls)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      setIsLoading(false)
    }
  }

  // Fetch all thumbnails on mount
  useEffect(() => {
    fetchAllThumbnails()
  }, [sectionId])

  // Load main resource content only when clicked
  useEffect(() => {
    const fetchResourceContent = async () => {
      if (resources[currentIndex]) {
        const resource = resources[currentIndex]

        if (resource.resourceType === 'MCQ') {
          // Fetch MCQ image if exists
          if (resource.content.mcq?.imageFile && !signedUrls[resource.content.mcq.imageFile]) {
            const mcqImageUrl = await getLocalFileUrl(resource.content.mcq.imageFile, 'MCQ_IMAGES')
            setSignedUrls(prev => ({
              ...prev,
              [resource.content.mcq.imageFile]: mcqImageUrl
            }))
          }
          
          // Fetch MCQ audio if exists
          if (resource.content.mcq?.audioFile && !signedUrls[resource.content.mcq.audioFile]) {
            const mcqAudioUrl = await getLocalFileUrl(resource.content.mcq.audioFile, 'MCQ_AUDIO')
            setSignedUrls(prev => ({
              ...prev,
              [resource.content.mcq.audioFile]: mcqAudioUrl
            }))
          }
        }

        // Load main resource content if not already loaded
        if (
          resource.content.fileName &&
          !signedUrls[resource.content.fileName]
        ) {
          const fileUrl = await getLocalFileUrl(
            resource.content.fileName,
            resource.resourceType
          )
          setSignedUrls(prev => ({
            ...prev,
            [resource.content.fileName]: fileUrl
          }))
        }

        // Load background images
        if (
          (resource.resourceType === 'AUDIO' ||
            resource.resourceType === 'TEXT' ||
            resource.resourceType === 'PPT') &&
          resource.content.backgroundImage &&
          !signedUrls[resource.content.backgroundImage]
        ) {
          const bgUrl = await getLocalFileUrl(
            resource.content.backgroundImage,
            'BACKGROUNDS'
          )
          setSignedUrls(prev => ({
            ...prev,
            [resource.content.backgroundImage]: bgUrl
          }))
        }

        // Load PPT preview images
        if (
          resource.resourceType === 'PPT' &&
          resource.content.previewImageUrl &&
          !signedUrls[resource.content.previewImageUrl]
        ) {
          const previewUrl = await getLocalFileUrl(
            resource.content.previewImageUrl,
            'PPT'
          )
          setSignedUrls(prev => ({
            ...prev,
            [resource.content.previewImageUrl]: previewUrl
          }))
        }
      }
    }

    fetchResourceContent()
  }, [currentIndex, resources])

  const handleNext = () => {
    if (currentIndex < resources.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const getThumbnailContent = (resource, signedUrl) => {
    switch (resource.resourceType) {
      case 'VIDEO':
      case 'IMAGE':
      case 'PDF':
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            {resource.content.fileName && (
              <img
                src={signedUrl}
                alt={resource.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Box>
        )
      
      case 'AUDIO':
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            {resource.content.backgroundImage && (
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt={resource.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Box>
        )

      case 'TEXT':
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            <Typography
              variant='body1'
              sx={{
                color: 'white',
                p: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {resource.content.text}
            </Typography>
          </Box>
        )

      default:
        return <Typography>Unsupported resource type</Typography>
    }
  }

  const recordResourceView = async (resource) => {
    try {
      if (!user.studentId) {
        console.error('No student ID found')
        return
      }

      await postData('resource-views/record', {
        studentId: user.studentId,
        resourceId: resource._id,
        courseId,
        unitId,
        sectionId
      })
    } catch (error) {
      console.error('Error recording resource view:', error)
    }
  }

  useEffect(() => {
    if (resources[currentIndex]) {
      recordResourceView(resources[currentIndex])
    }
  }, [currentIndex, resources])

  useEffect(() => {
    const fetchSectionProgress = async () => {
      if (!user?.studentId || !sectionId || !resources?.length) {
        setSectionProgress(0)
        return
      }

      try {
        const response = await getData(`resource-views/student/${user.studentId}`)
        if (response.status === 200) {
          const allViews = response.data.data
          
          // Filter views for the current section
          const currentSectionViews = allViews.filter(view => 
            view.sectionId?._id?.toString() === sectionId.toString()
          )

          // Get unique viewed resource IDs in current section
          const viewedResourceIds = new Set()
          currentSectionViews.forEach(view => {
            const resourceId = view.resourceId?._id?.toString() || view.resourceId?.toString()
            if (resourceId) {
              viewedResourceIds.add(resourceId)
            }
          })

          // Calculate progress
          const totalResourcesInSection = resources.length
          const viewedResourcesCount = viewedResourceIds.size
          
          console.log('Progress Calculation:', {
            totalResourcesInSection,
            viewedResourcesCount,
            viewedResourceIds: Array.from(viewedResourceIds),
            resourceIds: resources.map(r => r._id.toString())
          })

          const calculatedProgress = (viewedResourcesCount / totalResourcesInSection) * 100
          setSectionProgress(calculatedProgress)
        }
      } catch (error) {
        console.error('Error calculating section progress:', error)
        setSectionProgress(0)
      }
    }

    // Fetch progress whenever resources change or when a new resource view is recorded
    fetchSectionProgress()
  }, [user?.studentId, sectionId, resources, currentIndex])  // Added currentIndex to refresh on resource change

  if (isLoading) {
    return (
      <Paper
        elevation={5}
        sx={{
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          width: '100%',
          bgcolor: 'background.paper',
          flexDirection: 'column'
        }}
      >
        <CircularProgress
          size={180}
          thickness={3}
          sx={{
            color: 'primary.main',
            mb: 3
          }}
        />
        <Typography variant='h5'>Loading Learner's Frame</Typography>
      </Paper>
    )
  }

  return (
    <Grid container>
      <Grid size={12}>
        <Paper elevation={5} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
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

          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Resource Title Bar */}
            <Box
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Typography variant='h6'>
                {resources[currentIndex]?.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {resources[currentIndex]?.content?.externalLinks?.map((link, index) => (
                  link.url && (
                    <Box
                      key={index}
                      component='span'
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <IconButton
                        href={formatExternalUrl(link.url)}
                        target='_blank'
                        rel='noopener noreferrer'
                        component='a'
                        sx={{
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <Launch />
                        <Typography
                          variant='body2'
                          sx={{
                            fontSize: '14px',
                            display: { xs: 'none', sm: 'block' }
                          }}
                        >
                          {link.name || 'External Link'}
                        </Typography>
                      </IconButton>
                    </Box>
                  )
                ))}
                <IconButton
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  sx={{
                    color: 'white',
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={handleNext}
                  disabled={currentIndex === resources.length - 1}
                  sx={{
                    color: 'white',
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ bgcolor: 'white' }}>
              {resources[currentIndex] && (
                <ResourceRenderer
                  resource={resources[currentIndex]}
                  signedUrl={
                    signedUrls[resources[currentIndex].content.fileName]
                  }
                  signedUrls={signedUrls}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 2, px: 2, pb: 2 }}>
            <Typography variant='body2' gutterBottom>
              Section Progress: {Math.round(sectionProgress)}%
            </Typography>
            <LinearProgress variant='determinate' value={sectionProgress} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LearnerFrame