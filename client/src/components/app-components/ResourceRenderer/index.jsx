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
  const { state: mcqState, actions: mcqActions } = useMcqState(mcqProgress)
  
  useResourceProgress(
    studentId,
    courseId,
    unitId,
    sectionId
  )

  const handleMcqSubmit = () => {
    const isCorrect = mcqActions.submitAnswers(resource.content.mcq.correctAnswers)
    
    if (isCorrect) {
      onMcqCompleted(resource._id, true, mcqState.attempts)
      if (isLastResource) {
        onNext()
      }
    } else {
    }
  }

  const renderResource = () => {
    switch (resource.resourceType) {
      case 'VIDEO':
        return <VideoRenderer signedUrl={signedUrl} />

      case 'IMAGE':
        return <ImageRenderer signedUrl={signedUrl} resourceName={resource.name} />

      case 'AUDIO':
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
        return <PdfRenderer signedUrl={signedUrl} signedUrls={signedUrls} resource={resource} />

      case 'PPT':
        return <PptRenderer signedUrl={signedUrl} signedUrls={signedUrls} resource={resource} />

      case 'TEXT':
        return <TextRenderer signedUrls={signedUrls} resource={resource} />

      case 'MCQ':
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

  return (
    <Box sx={{ width: '100%' }}>
      {renderResource()}
    </Box>
  )
}

export default ResourceRenderer 