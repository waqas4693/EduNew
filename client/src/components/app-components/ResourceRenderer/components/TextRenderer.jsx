import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'

const TextRenderer = ({ signedUrls, resource }) => {
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
}

export default TextRenderer 