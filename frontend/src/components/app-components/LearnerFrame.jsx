import axios from 'axios'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'

import { getData } from '../../api/api'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, IconButton, Paper, Checkbox, Button, Alert } from '@mui/material'
import { ChevronLeft, ChevronRight, Launch } from '@mui/icons-material'

const formatExternalUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const ResourceRenderer = ({ resource, signedUrl, signedUrls }) => {
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const audioRef = useRef(null)
  const [playCount, setPlayCount] = useState(0)

  useEffect(() => {
    if (resource.resourceType === 'AUDIO' && audioRef.current) {
      const audio = audioRef.current
      const repeatCount = resource.content.repeatCount || 1

      const handleEnded = () => {
        setPlayCount(prev => {
          const newCount = prev + 1
          if (newCount < repeatCount) {
            audio.play()
          }
          return newCount
        })
      }

      const handlePlay = () => {
        setPlayCount(0)
      }

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('play', handlePlay)

      return () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('play', handlePlay)
      }
    }
  }, [resource])

  const handleAnswerSelect = (option) => {
    if (hasSubmitted) return

    setSelectedAnswers(prev => {
      const currentAnswers = [...prev]
      const index = currentAnswers.indexOf(option)

      if (index === -1 && currentAnswers.length < resource.content.mcq.numberOfCorrectAnswers) {
        return [...currentAnswers, option]
      } else if (index !== -1) {
        return currentAnswers.filter(ans => ans !== option)
      }
      return currentAnswers
    })
  }

  const handleSubmit = () => {
    if (selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers) {
      alert(`Please select ${resource.content.mcq.numberOfCorrectAnswers} answer(s)`)
      return
    }

    const isAnswerCorrect = 
      selectedAnswers.length === resource.content.mcq.correctAnswers.length &&
      selectedAnswers.every(answer => resource.content.mcq.correctAnswers.includes(answer))

    setIsCorrect(isAnswerCorrect)
    setHasSubmitted(true)
  }

  const handleReset = () => {
    setSelectedAnswers([])
    setHasSubmitted(false)
    setIsCorrect(false)
  }

  const getOptionStyle = (option) => {
    if (!hasSubmitted) {
      return {
        border: selectedAnswers.includes(option) ? '2px solid #3366CC' : '1px solid #ddd'
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

  switch (resource.resourceType) {
    case 'VIDEO':
      return (
        <Box sx={{ position: 'relative', width: '100%', height: '80vh' }}>
          <video
            controls
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
            p: 3,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}
        >
          <Typography variant='body1'>{resource.content.text}</Typography>
        </Box>
      )

    case 'MCQ':
      return (
        <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
          {resource.content.mcq.imageUrl && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <img 
                src={signedUrls[resource.content.mcq.imageUrl]} 
                alt="Question"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </Box>
          )}

          <Typography variant="h6" sx={{ mb: 2, color: '#000' }}>
            {resource.content.mcq.question}
          </Typography>

          {hasSubmitted && (
            <Alert 
              severity={isCorrect ? "success" : "error"} 
              sx={{ mb: 2 }}
            >
              {isCorrect 
                ? "Correct! Well done!" 
                : `Incorrect. Expected ${resource.content.mcq.numberOfCorrectAnswers} correct answer(s).`}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Select {resource.content.mcq.numberOfCorrectAnswers} answer{resource.content.mcq.numberOfCorrectAnswers > 1 ? 's' : ''}.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {resource.content.mcq.options.map((option, index) => (
              <Box
                key={index}
                onClick={() => handleAnswerSelect(option)}
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  cursor: hasSubmitted ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  ...getOptionStyle(option),
                  '&:hover': {
                    bgcolor: hasSubmitted ? undefined : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <Checkbox
                  checked={selectedAnswers.includes(option)}
                  disabled={hasSubmitted}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#000' }}>{option}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            {!hasSubmitted ? (
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers}
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                onClick={handleReset}
              >
                Try Again
              </Button>
            )}
          </Box>
        </Box>
      )

    case 'AUDIO':
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundImage: resource.content.backgroundImage
              ? `url(${signedUrls[resource.content.backgroundImageUrl]})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            bgcolor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: 2
          }}
        >
          <audio
            ref={audioRef}
            src={signedUrl}
            style={{ width: '100%', height: '50px', backgroundColor: '#000' }}
            controls
          />
          <Typography sx={{ color: 'white' }}>
            Will repeat {resource.content.repeatCount || 1} time{resource.content.repeatCount > 1 ? 's' : ''}
            {playCount > 0 && ` (${playCount}/${resource.content.repeatCount})`}
          </Typography>
        </Box>
      )

    case 'PPT':
      return (
        <Box sx={{ 
          width: '100%', 
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          {resource.content.previewImage && (
            <img
              src={signedUrls[resource.content.previewImage]}
              alt="PPT Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
          <Button 
            variant="contained"
            startIcon={<Launch />}
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Presentation
          </Button>
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
  const navigate = useNavigate()
  const { courseId, unitId, sectionId } = useParams()

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

  // Fetch all thumbnails on mount
  useEffect(() => {
    const fetchAllThumbnails = async () => {
      try {
        const response = await getData(`resources/${sectionId}`)
        if (response.status === 200) {
          setResources(response.data.resources)

          // Fetch thumbnails for all resources
          const thumbnailPromises = response.data.resources.map(
            async resource => {
              if (resource.content.thumbnailUrl) {
                // Get thumbnail URL
                const thumbnailUrl = await getSignedUrl(
                  resource.content.thumbnailUrl
                )
                return {
                  fileName: resource.content.thumbnailUrl,
                  url: thumbnailUrl
                }
              }
              // Get default thumbnail based on resource type
              if (resource.resourceType !== 'TEXT') {
                const defaultThumbnail = await getSignedUrl(resource.name)
                return {
                  fileName: resource.name,
                  url: defaultThumbnail
                }
              }
              return null
            }
          )

          const thumbnailUrls = await Promise.all(thumbnailPromises)

          // Update signedUrls state with all thumbnail URLs
          const newSignedUrls = {}
          thumbnailUrls.forEach(item => {
            if (item) {
              newSignedUrls[item.fileName] = item.url
            }
          })

          setSignedUrls(prev => ({
            ...prev,
            ...newSignedUrls
          }))
        }
      } catch (error) {
        console.error('Error fetching resources and thumbnails:', error)
      }
    }

    fetchAllThumbnails()
  }, [sectionId])

  // Load main resource content only when clicked
  useEffect(() => {
    const fetchResourceContent = async () => {
      if (resources[currentIndex]) {
        const resource = resources[currentIndex]

        // For MCQ type, fetch the question image if it exists
        if (
          resource.resourceType === 'MCQ' &&
          resource.content.mcq?.imageUrl &&
          !signedUrls[resource.content.mcq.imageUrl]
        ) {
          const mcqImageUrl = await getSignedUrl(resource.content.mcq.imageUrl)
          setSignedUrls(prev => ({
            ...prev,
            [resource.content.mcq.imageUrl]: mcqImageUrl
          }))
        }

        // Skip if it's TEXT type without image
        if (resource.resourceType === 'TEXT' && !resource.content.imageUrl) {
          return
        }

        // Load main resource content if not already loaded
        if (!signedUrls[resource.name]) {
          const signedUrl = await getSignedUrl(resource.name)
          setSignedUrls(prev => ({
            ...prev,
            [resource.name]: signedUrl
          }))
        }

        // Load additional resource-specific content
        if (
          resource.resourceType === 'AUDIO' &&
          resource.content.backgroundImageUrl &&
          !signedUrls[resource.content.backgroundImageUrl]
        ) {
          const bgUrl = await getSignedUrl(resource.content.backgroundImageUrl)
          setSignedUrls(prev => ({
            ...prev,
            [resource.content.backgroundImageUrl]: bgUrl
          }))
        }

        if (
          resource.resourceType === 'PPT' &&
          resource.content.previewImageUrl &&
          !signedUrls[resource.content.previewImageUrl]
        ) {
          const previewUrl = await getSignedUrl(
            resource.content.previewImageUrl
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
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            <video
              src={signedUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )

      case 'IMAGE':
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            <img
              src={signedUrl}
              alt={resource.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )

      case 'AUDIO':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage: resource.content.thumbnailUrl
                ? `url(${signedUrls[resource.content.thumbnailUrl]})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <audio
              src={signedUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              controls
            />
          </Box>
        )

      case 'PDF':
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            <iframe
              src={signedUrl}
              width='100%'
              height='100%'
              title={resource.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )

      case 'PPT':
        return (
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#000' }}>
            <img
              src={resource.content.previewImageUrl}
              alt={resource.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
                {resources[currentIndex]?.content?.externalLink && (
                  <Box
                    component='span'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <IconButton
                      href={formatExternalUrl(resources[currentIndex].content.externalLink)}
                      target='_blank'
                      rel='noopener noreferrer'
                      component="a"
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
                        External Link
                      </Typography>
                    </IconButton>
                  </Box>
                )}
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
                  signedUrl={signedUrls[resources[currentIndex].name]}
                  signedUrls={signedUrls}
                />
              )}
            </Box>

            {/* Thumbnails Carousel */}
            <Box
              sx={{
                bgcolor: '#f5f5f5',
                p: 2,
                position: 'relative',
                width: '100%',
                overflow: 'hidden'
              }}
            >
              {/* Left Arrow */}
              <IconButton
                sx={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'primary.main',
                  color: 'white',
                  height: '100px',
                  width: '24px',
                  borderRadius: '6px',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'primary.light',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
                onClick={() => {
                  const carousel = document.getElementById('thumbnail-carousel')
                  carousel.scrollBy({ left: -200, behavior: 'smooth' })
                }}
              >
                <ChevronLeft />
              </IconButton>

              <Box
                id='thumbnail-carousel'
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  px: 4,
                  mx: 4,
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  width: 'calc(100% - 8px)',
                  position: 'relative'
                }}
              >
                {resources.map((resource, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    sx={{
                      minWidth: '150px',
                      height: '100px',
                      bgcolor: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border:
                        currentIndex === index
                          ? '2px solid primary.main'
                          : '1px solid #ddd',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Use thumbnail if available, otherwise fall back to type-specific content */}
                    {resource.content.thumbnailUrl ? (
                      <img
                        src={signedUrls[resource.content.thumbnailUrl]}
                        alt={resource.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      getThumbnailContent(resource, signedUrls[resource.name])
                    )}

                    {/* Resource Type Label */}
                    <Typography
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontSize: '12px',
                        p: 0.5,
                        textAlign: 'center'
                      }}
                    >
                      {resource.resourceType}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Right Arrow */}
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'primary.main',
                  color: 'white',
                  height: '100px',
                  width: '24px',
                  borderRadius: '6px',

                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'primary.light',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
                onClick={() => {
                  const carousel = document.getElementById('thumbnail-carousel')
                  carousel.scrollBy({ left: 200, behavior: 'smooth' })
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LearnerFrame
