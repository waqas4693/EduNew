import { Box, Typography, Paper, Button } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'
import AudioPlayer from './common/AudioPlayer'
import BlurUpImage from './common/BlurUpImage'

const McqRenderer = ({
  resource,
  state,
  actions,
  onSubmit,
  onNext,
  isLastResource,
  submitButtonText = 'Submit',
  signedUrls
}) => {
  const { selectedAnswers, hasSubmitted, isCorrect, attempts } = state
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F']
  const options = resource.content?.mcq?.options || []
  const hasImage = Boolean(
    resource.content?.mcq?.imageFile && signedUrls?.[resource.content.mcq.imageFile]
  )
  const hasAudio = Boolean(
    resource.content?.mcq?.audioFile && signedUrls?.[resource.content.mcq.audioFile]
  )

  const getOptionStyle = (option) => {
    if (!hasSubmitted) {
      const isSelected = selectedAnswers.includes(option)
      return {
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'rgba(10, 37, 64, 0.16)',
        bgcolor: isSelected ? 'rgba(31, 126, 194, 0.08)' : '#fff'
      }
    }

    const isSelected = selectedAnswers.includes(option)
    const isCorrectOption = resource.content.mcq.correctAnswers.includes(option)

    if (isCorrect && isCorrectOption) {
      return { bgcolor: 'success.main', color: '#fff', border: '1px solid transparent' }
    }

    if (!isCorrect && isSelected) {
      return { bgcolor: 'error.main', color: '#fff', border: '1px solid transparent' }
    }

    if (state.completed && isCorrectOption) {
      return { bgcolor: 'success.main', color: '#fff', border: '1px solid transparent' }
    }

    return {
      border: '1px solid rgba(10, 37, 64, 0.16)',
      bgcolor: '#fff'
    }
  }

  const renderOptions = (readOnly = false) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1,
        flex: 1,
        minHeight: 0,
        alignContent: 'start'
      }}
    >
      {options.map((option, index) => (
        <Paper
          key={`${option}-${index}`}
          elevation={0}
          sx={{
            px: 1.5,
            py: 1.25,
            cursor: readOnly || hasSubmitted ? 'default' : 'pointer',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            ...getOptionStyle(option),
            '&:hover':
              readOnly || hasSubmitted
                ? undefined
                : { bgcolor: 'rgba(10, 37, 64, 0.04)' }
          }}
          onClick={() => {
            if (readOnly || hasSubmitted) return
            actions.selectAnswer(option, resource.content.mcq.numberOfCorrectAnswers)
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 15, md: 16 },
              fontWeight: 600,
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}
          >
            {`${alphabet[index]}. ${option}`}
          </Typography>
        </Paper>
      ))}
    </Box>
  )

  const renderActions = () => {
    if (state.completed && !hasSubmitted) {
      if (isLastResource) return null
      return (
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<NavigateNext />}
          onClick={onNext}
        >
          Next
        </Button>
      )
    }

    if (!hasSubmitted) {
      return (
        <Button
          variant="contained"
          size="small"
          onClick={onSubmit}
          disabled={
            selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers
          }
        >
          {submitButtonText}
        </Button>
      )
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: '8px',
            bgcolor: isCorrect ? 'rgba(46, 125, 50, 0.12)' : 'rgba(211, 47, 47, 0.12)',
            color: isCorrect ? 'success.dark' : 'error.dark',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
        </Box>

        {isCorrect && !isLastResource ? (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<NavigateNext />}
            onClick={onNext}
          >
            Next
          </Button>
        ) : (
          !isCorrect && (
            <Button variant="outlined" size="small" onClick={() => actions.reset()}>
              Try Again
            </Button>
          )
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        height: { xs: 'auto', md: 'min(62vh, 520px)' },
        maxHeight: { md: '62vh' },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        overflow: 'hidden'
      }}
    >
      {hasAudio && (
        <Box sx={{ flexShrink: 0 }}>
          <AudioPlayer
            src={signedUrls[resource.content.mcq.audioFile]}
            repeatCount={1}
          />
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          flexShrink: 0
        }}
      >
        <Typography
          sx={{
            color: 'secondary.dark',
            fontWeight: 700,
            fontSize: { xs: 15, md: 16 },
            lineHeight: 1.35,
            flex: 1
          }}
        >
          {resource.content.mcq.question}
        </Typography>
        {attempts > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, pt: 0.25 }}>
            Attempts: {attempts}
          </Typography>
        )}
      </Box>

      {state.completed && !hasSubmitted && (
        <Box
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: '8px',
            bgcolor: 'rgba(46, 125, 50, 0.12)',
            color: 'success.dark',
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          Already completed — you can continue.
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: hasImage ? 'row' : 'column' },
          gap: 1.5,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {renderOptions(state.completed && !hasSubmitted)}

        {hasImage && (
          <Box
            sx={{
              flex: { md: '0 0 42%' },
              minHeight: { xs: 140, md: 0 },
              maxHeight: { xs: 180, md: '100%' },
              overflow: 'hidden'
            }}
          >
            <BlurUpImage
              src={signedUrls[resource.content.mcq.imageFile]}
              alt="Question"
              maxHeight="100%"
              borderRadius="10px"
            />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1,
          flexShrink: 0,
          pt: 0.5
        }}
      >
        {renderActions()}
      </Box>
    </Box>
  )
}

export default McqRenderer
