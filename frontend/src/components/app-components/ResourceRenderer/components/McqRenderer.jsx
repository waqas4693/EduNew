import { Box, Typography, Paper, Button, Alert } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'
import AudioPlayer from './common/AudioPlayer'

const McqRenderer = ({
  resource,
  state,
  actions,
  onSubmit,
  onNext,
  isLastResource,
  signedUrls
}) => {
  console.log('=== McqRenderer Component Initialized ===')
  console.log('MCQ resource:', {
    id: resource._id,
    name: resource.name,
    question: resource.content.mcq.question,
    optionsCount: resource.content.mcq.options.length,
    correctAnswersCount: resource.content.mcq.correctAnswers.length,
    numberOfCorrectAnswers: resource.content.mcq.numberOfCorrectAnswers
  })
  console.log('MCQ state:', state)
  console.log('Props:', { isLastResource, hasSignedUrls: Object.keys(signedUrls).length })

  const { selectedAnswers, hasSubmitted, isCorrect, attempts } = state
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F']

  const getOptionStyle = (option) => {
    if (!hasSubmitted) {
      return {
        border: selectedAnswers.includes(option)
          ? '2px solid #3366CC'
          : '1px solid #ddd'
      }
    }

    const isSelected = selectedAnswers.includes(option)
    const isCorrectOption = resource.content.mcq.correctAnswers.includes(option)

    if (isCorrect) {
      if (isCorrectOption) {
        return { bgcolor: '#4CAF50', color: 'white' }
      }
    } else {
      if (isSelected) {
        return { bgcolor: '#f44336', color: 'white' }
      }
    }
    
    return { border: '1px solid #ddd' }
  }

  if (state.completed && !hasSubmitted) {
    console.log('=== Rendering Completed MCQ ===')
    console.log('MCQ already completed, showing success state')
    
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

        {/* MCQ Audio */}
        {resource.content.mcq?.audioFile && signedUrls[resource.content.mcq.audioFile] && (
          <Box sx={{ mb: 2 }}>
            <AudioPlayer
              src={signedUrls[resource.content.mcq.audioFile]}
              repeatCount={1}
            />
          </Box>
        )}

        <Alert severity="success" sx={{ mb: 2 }}>
          You have already completed this MCQ correctly! You can proceed to the next one.
        </Alert>
        
        {/* Options with correct answers highlighted */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {resource.content.mcq.options.map((option, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                bgcolor: resource.content.mcq.correctAnswers.includes(option)
                  ? 'success.main'
                  : 'white',
                color: resource.content.mcq.correctAnswers.includes(option)
                  ? 'white'
                  : 'inherit',
              }}
            >
              <Typography>{`${alphabet[index]}. ${option}`}</Typography>
            </Paper>
          ))}
        </Box>
        
        {/* Next button for already completed MCQs */}
        {!isLastResource && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<NavigateNext />}
            onClick={() => {
              console.log('Next button clicked for completed MCQ')
              onNext()
            }}
            sx={{ mt: 2 }}
          >
            Next
          </Button>
        )}
      </Box>
    )
  }

  console.log('=== Rendering Active MCQ ===')
  console.log('MCQ state for rendering:', {
    selectedAnswers,
    hasSubmitted,
    isCorrect,
    attempts,
    hasImage: !!resource.content.mcq?.imageFile,
    hasAudio: !!resource.content.mcq?.audioFile
  })

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

      {/* MCQ Audio */}
      {resource.content.mcq?.audioFile && signedUrls[resource.content.mcq.audioFile] && (
        <Box sx={{ mb: 2 }}>
          <AudioPlayer
            src={signedUrls[resource.content.mcq.audioFile]}
            repeatCount={1}
          />
        </Box>
      )}

      {attempts > 0 && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Attempts: {attempts}
        </Typography>
      )}

      {/* Options */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {resource.content.mcq.options.map((option, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              cursor: hasSubmitted ? 'default' : 'pointer',
              ...getOptionStyle(option),
              '&:hover': {
                bgcolor: hasSubmitted 
                  ? getOptionStyle(option).bgcolor || 'white'
                  : '#f5f5f5'
              }
            }}
            onClick={() => {
              console.log('=== Option Clicked ===')
              console.log('Option clicked:', { option, index: index + 1 })
              console.log('Current selected answers:', selectedAnswers)
              console.log('Required correct answers:', resource.content.mcq.numberOfCorrectAnswers)
              
              actions.selectAnswer(option, resource.content.mcq.numberOfCorrectAnswers)
              
              console.log('Option selection action completed')
            }}
          >
            <Typography>{`${alphabet[index]}. ${option}`}</Typography>
          </Paper>
        ))}
      </Box>

      {!hasSubmitted ? (
        <Button
          variant="contained"
          onClick={() => {
            console.log('=== Submit Button Clicked ===')
            console.log('Selected answers:', selectedAnswers)
            console.log('Required answers:', resource.content.mcq.numberOfCorrectAnswers)
            console.log('Correct answers:', resource.content.mcq.correctAnswers)
            
            onSubmit()
          }}
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
          
          {/* Show Next button if answer is correct and not the last resource */}
          {isCorrect && !isLastResource ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<NavigateNext />}
              onClick={() => {
                console.log('=== Next Button Clicked (Correct Answer) ===')
                console.log('MCQ answered correctly, proceeding to next')
                onNext()
              }}
              sx={{ mt: 1 }}
            >
              Next
            </Button>
          ) : (
            /* Only show Try Again button if the answer was incorrect */
            !isCorrect && (
              <Button
                variant="outlined"
                onClick={() => {
                  console.log('=== Try Again Button Clicked ===')
                  console.log('Resetting MCQ state for retry')
                  actions.reset()
                }}
                sx={{ mt: 1 }}
              >
                Try Again
              </Button>
            )
          )}
        </Box>
      )}
    </Box>
  )
}

export default McqRenderer 