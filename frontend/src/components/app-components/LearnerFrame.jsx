import axios from 'axios'
import url from '../config/server-url'
import Grid from '@mui/material/Grid2'

import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, IconButton, Paper } from '@mui/material'
import { ChevronLeft, ChevronRight, Launch } from '@mui/icons-material'

const ResourceRenderer = ({ resource, signedUrl }) => {
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
          const thumbnailPromises = response.data.resources.map(async resource => {
            if (resource.content.thumbnailUrl) {
              // Get thumbnail URL
              const thumbnailUrl = await getSignedUrl(resource.content.thumbnailUrl)
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
          })

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
        if (resource.resourceType === 'AUDIO' && 
            resource.content.backgroundImageUrl && 
            !signedUrls[resource.content.backgroundImageUrl]) {
          const bgUrl = await getSignedUrl(resource.content.backgroundImageUrl)
          setSignedUrls(prev => ({
            ...prev,
            [resource.content.backgroundImageUrl]: bgUrl
          }))
        }

        if (resource.resourceType === 'PPT' && 
            resource.content.previewImageUrl && 
            !signedUrls[resource.content.previewImageUrl]) {
          const previewUrl = await getSignedUrl(resource.content.previewImageUrl)
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
          <Box sx={{ p: 1 }}>
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
            {/* <Box
              sx={{
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                      href={resources[currentIndex].content.externalLink}
                      target='_blank'
                      rel='noopener noreferrer'
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
                          display: { xs: 'none', sm: 'block' } // Hide text on mobile
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
            </Box> */}

            {/* Main Content */}
            <Box sx={{ bgcolor: 'white' }}>
              {resources[currentIndex] && (
                <ResourceRenderer
                  resource={resources[currentIndex]}
                  signedUrl={signedUrls[resources[currentIndex].name]}
                />
              )}
            </Box>

            {/* Thumbnails Carousel */}
            <Box
              sx={{
                bgcolor: '#f5f5f5',
                p: 2,
                position: 'relative'
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
