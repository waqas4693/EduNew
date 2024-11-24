import { useState, useEffect } from 'react'
import { Box, Typography, IconButton, Paper } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { getData } from '../../api/api'
import axios from 'axios'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'
import { ChevronLeft, ChevronRight, Launch } from '@mui/icons-material'

const ResourceRenderer = ({ resource, signedUrl }) => {
  switch (resource.resourceType) {
    case 'VIDEO':
      return (
        <Box sx={{ position: 'relative', width: '100%', pt: '56.25%' }}>
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
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <img
            src={signedUrl}
            alt={resource.name}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </Box>
      )

    case 'AUDIO':
      return (
        <Box
          sx={{
            width: '100%',
            backgroundImage: resource.content.backgroundImage
              ? `url(${resource.content.backgroundImageUrl})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            p: 3
          }}
        >
          <audio controls style={{ width: '100%' }}>
            <source src={signedUrl} type='audio/mpeg' />
          </audio>
        </Box>
      )

    case 'PDF':
      return (
        <Box sx={{ width: '100%', height: '70vh' }}>
          <iframe
            src={signedUrl}
            width='100%'
            height='100%'
            title={resource.name}
          />
        </Box>
      )

    case 'PPT':
      return (
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <img
            src={resource.content.previewImageUrl}
            alt={resource.name}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
          <Typography sx={{ mt: 2 }}>
            <a href={signedUrl} target='_blank' rel='noopener noreferrer'>
              Download Presentation
            </a>
          </Typography>
        </Box>
      )

    case 'TEXT':
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant='body1' sx={{ mb: 3 }}>
            {resource.content.text}
          </Typography>
          {resource.content.questions.map((q, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography
                variant='subtitle1'
                sx={{ fontWeight: 'bold', mb: 1 }}
              >
                Question {index + 1}: {q.question}
              </Typography>
              <Typography variant='body1'>Answer: {q.answer}</Typography>
            </Box>
          ))}
          {resource.content.imageUrl && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <img
                src={signedUrl}
                alt='Supporting Image'
                style={{ maxWidth: '100%', maxHeight: '50vh' }}
              />
            </Box>
          )}
        </Box>
      )

    default:
      return <Typography>Unsupported resource type</Typography>
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

  useEffect(() => {
    fetchResources()
  }, [sectionId])

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (resources[currentIndex]) {
        const resource = resources[currentIndex]

        // Don't fetch URL for TEXT type unless it has an image
        if (resource.resourceType === 'TEXT' && !resource.content.imageUrl) {
          return
        }

        // Get main resource URL
        if (!signedUrls[resource.name]) {
          const signedUrl = await getSignedUrl(resource.name)
          setSignedUrls(prev => ({
            ...prev,
            [resource.name]: signedUrl
          }))
        }

        // Get background image URL for audio
        if (
          resource.resourceType === 'AUDIO' &&
          resource.content.backgroundImageUrl
        ) {
          if (!signedUrls[resource.content.backgroundImageUrl]) {
            const bgSignedUrl = await getSignedUrl(
              resource.content.backgroundImageUrl
            )
            setSignedUrls(prev => ({
              ...prev,
              [resource.content.backgroundImageUrl]: bgSignedUrl
            }))
          }
        }

        // Get preview image URL for PPT
        if (
          resource.resourceType === 'PPT' &&
          resource.content.previewImageUrl
        ) {
          if (!signedUrls[resource.content.previewImageUrl]) {
            const previewSignedUrl = await getSignedUrl(
              resource.content.previewImageUrl
            )
            setSignedUrls(prev => ({
              ...prev,
              [resource.content.previewImageUrl]: previewSignedUrl
            }))
          }
        }
      }
    }
    fetchSignedUrl()
  }, [currentIndex, resources])

  const fetchResources = async () => {
    try {
      const response = await getData(`resources/${sectionId}`)
      if (response.status === 200) {
        setResources(response.data.resources)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

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
              backgroundImage: resource.content.backgroundImage
                ? `url(${resource.content.backgroundImageUrl})`
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
          <Box sx={{ mb: 2, p: 2 }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={() => navigate(`/units/${courseId}/section/${unitId}`)}
            >
              <ChevronLeft sx={{ color: 'primary.main' }} /> Back To Section
            </Typography>
          </Box>

          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant='h6'>
                {resources[currentIndex]?.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {resources[currentIndex]?.content?.externalLink && (
                  <IconButton
                    href={resources[currentIndex].content.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'white',
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.1)' 
                      }
                    }}
                  >
                    <Launch />
                  </IconButton>
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
            <Box sx={{ bgcolor: 'white', p: 2 }}>
              {resources[currentIndex] && (
                <ResourceRenderer 
                  resource={resources[currentIndex]} 
                  signedUrl={signedUrls[resources[currentIndex].name]}
                />
              )}
            </Box>

            {/* Thumbnails Carousel */}
            <Box sx={{ 
              bgcolor: '#f5f5f5',
              p: 2,
              position: 'relative'
            }}>
              <IconButton 
                sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'white' }
                }}
                onClick={() => {
                  const carousel = document.getElementById('thumbnail-carousel');
                  carousel.scrollBy({ left: -200, behavior: 'smooth' });
                }}
              >
                <ChevronLeft />
              </IconButton>

              <Box
                id="thumbnail-carousel"
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  px: 6,
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
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
                      border: currentIndex === index ? '2px solid primary.main' : '1px solid #ddd',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Use thumbnail if available, otherwise fall back to type-specific content */}
                    {resource.content.thumbnailUrl ? (
                      <img
                        src={signedUrls[resource.content.thumbnailUrl]}
                        alt={resource.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

              <IconButton 
                sx={{ 
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'white' }
                }}
                onClick={() => {
                  const carousel = document.getElementById('thumbnail-carousel');
                  carousel.scrollBy({ left: 200, behavior: 'smooth' });
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
