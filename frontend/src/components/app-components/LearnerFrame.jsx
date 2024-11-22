import { useState, useEffect } from 'react'
import { Box, Typography, IconButton, Paper, Grid } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { getData } from '../../api/api'

const ResourceRenderer = ({ resource }) => {
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
            src={resource.content.url}
          />
        </Box>
      )
    
    case 'IMAGE':
      return (
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <img 
            src={resource.content.url} 
            alt={resource.name}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </Box>
      )
    
    case 'AUDIO':
      return (
        <Box sx={{ 
          width: '100%', 
          backgroundImage: `url(${resource.content.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          p: 3
        }}>
          <audio controls style={{ width: '100%' }}>
            <source src={resource.content.url} type="audio/mpeg" />
          </audio>
        </Box>
      )
    
    case 'PDF':
      return (
        <Box sx={{ width: '100%', height: '70vh' }}>
          <iframe
            src={resource.content.url}
            width="100%"
            height="100%"
            title={resource.name}
          />
        </Box>
      )
    
    case 'PPT':
      return (
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <img 
            src={resource.content.previewImage} 
            alt={resource.name}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
          <Typography sx={{ mt: 2 }}>
            <a href={resource.content.url} target="_blank" rel="noopener noreferrer">
              Download Presentation
            </a>
          </Typography>
        </Box>
      )
    
    case 'TEXT':
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {resource.content.text}
          </Typography>
          {resource.content.questions.map((q, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Question {index + 1}: {q.question}
              </Typography>
              <Typography variant="body1">
                Answer: {q.answer}
              </Typography>
            </Box>
          ))}
        </Box>
      )
    
    default:
      return <Typography>Unsupported resource type</Typography>
  }
}

const LearnerFrame = () => {
  const [resources, setResources] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()
  const { courseId, unitId, sectionId } = useParams()

  useEffect(() => {
    fetchResources()
  }, [sectionId])

  const fetchResources = async () => {
    try {
      const response = await getData(`sections/${sectionId}/resources`)
      if (response.status === 200) {
        setResources(response.data.data)
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

  return (
    <Grid container>
      <Grid size={12}>
        <Paper elevation={5} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Box sx={{ mb: 2, p: 2 }}>
            <Typography
              variant='body2'
              sx={{ color: 'primary.main', cursor: 'pointer' }}
              onClick={() => navigate(`/units/${courseId}/section/${unitId}`)}
            >
              &lt; Back To Section
            </Typography>
          </Box>

          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='h6'>
              {resources[currentIndex]?.name}
            </Typography>
            <Typography>
              {currentIndex + 1}/{resources.length}
            </Typography>
          </Box>

          {resources[currentIndex] && (
            <ResourceRenderer resource={resources[currentIndex]} />
          )}

          <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={handleNext} disabled={currentIndex === resources.length - 1}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LearnerFrame 