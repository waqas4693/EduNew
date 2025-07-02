import { Box, Typography } from '@mui/material'
import VideoRenderer from './components/VideoRenderer'
import ImageRenderer from './components/ImageRenderer'
import AudioPlayer from './components/common/AudioPlayer'
import PdfRenderer from './components/PdfRenderer'
import PptRenderer from './components/PptRenderer'
import TextRenderer from './components/TextRenderer'
import McqRenderer from './components/McqRenderer'
import useMcqState from './hooks/useMcqState'
import useResourceProgress from './hooks/useResourceProgress'

const ResourceRenderer = ({
  resource,
  signedUrl,
  signedUrls,
  onMcqCompleted,
  mcqProgress,
  onNext,
  isLastResource,
  studentId,
  courseId,
  unitId,
  sectionId
}) => {
  console.log('=== ResourceRenderer Component Initialized ===')
  console.log('Resource details:', {
    id: resource._id,
    name: resource.name,
    type: resource.resourceType,
    number: resource.number
  })
  console.log('Props:', {
    hasSignedUrl: !!signedUrl,
    signedUrlsCount: Object.keys(signedUrls).length,
    isLastResource,
    studentId,
    courseId,
    unitId,
    sectionId
  })

  const { state: mcqState, actions: mcqActions } = useMcqState(mcqProgress)
  console.log('MCQ state:', mcqState)
  
  const { progress } = useResourceProgress(
    studentId,
    courseId,
    unitId,
    sectionId
  )
  console.log('Resource progress:', progress)

  const handleMcqSubmit = () => {
    console.log('=== MCQ Submit Handler ===')
    console.log('MCQ state before submission:', mcqState)
    console.log('Correct answers:', resource.content.mcq.correctAnswers)
    
    const isCorrect = mcqActions.submitAnswers(resource.content.mcq.correctAnswers)
    console.log('MCQ submission result:', { isCorrect, attempts: mcqState.attempts })
    
    if (isCorrect) {
      console.log('MCQ answered correctly, calling completion handler')
      onMcqCompleted(resource._id, true, mcqState.attempts)
      if (isLastResource) {
        console.log('Last resource MCQ completed, calling onNext')
        onNext()
      }
    } else {
      console.log('MCQ answered incorrectly, not proceeding')
    }
  }

  const renderResource = () => {
    console.log('=== Rendering Resource ===')
    console.log('Resource type:', resource.resourceType)
    
    switch (resource.resourceType) {
      case 'VIDEO':
        console.log('Rendering VideoRenderer')
        return <VideoRenderer signedUrl={signedUrl} />

      case 'IMAGE':
        console.log('Rendering ImageRenderer')
        return <ImageRenderer signedUrl={signedUrl} resourceName={resource.name} />

      case 'AUDIO':
        console.log('Rendering AudioRenderer')
        console.log('Audio details:', {
          hasSignedUrl: !!signedUrl,
          repeatCount: resource.content.repeatCount || 1,
          hasBackgroundImage: !!resource.content.backgroundImage
        })
        return (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <AudioPlayer
              src={signedUrl}
              repeatCount={resource.content.repeatCount || 1}
            />
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

      case 'PDF':
        console.log('Rendering PdfRenderer')
        return <PdfRenderer signedUrl={signedUrl} signedUrls={signedUrls} resource={resource} />

      case 'PPT':
        console.log('Rendering PptRenderer')
        return <PptRenderer signedUrl={signedUrl} signedUrls={signedUrls} resource={resource} />

      case 'TEXT':
        console.log('Rendering TextRenderer')
        return <TextRenderer signedUrls={signedUrls} resource={resource} />

      case 'MCQ':
        console.log('Rendering McqRenderer')
        console.log('MCQ renderer props:', {
          hasMcqContent: !!resource.content.mcq,
          submitButtonText: isLastResource ? 'Complete Section' : 'Submit',
          isLastResource
        })
        return (
          <McqRenderer
            resource={resource}
            state={mcqState}
            actions={mcqActions}
            onSubmit={handleMcqSubmit}
            onNext={onNext}
            isLastResource={isLastResource}
            submitButtonText={isLastResource ? 'Complete Section' : 'Submit'}
            signedUrls={signedUrls}
          />
        )

      default:
        console.warn('=== Unsupported Resource Type ===')
        console.warn('Resource type not supported:', resource.resourceType)
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

  console.log('=== ResourceRenderer Rendering ===')
  return (
    <Box sx={{ width: '100%' }}>
      {renderResource()}
    </Box>
  )
}

export default ResourceRenderer 