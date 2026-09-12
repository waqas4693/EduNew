import { Box } from '@mui/material'
import BlurUpImage from './common/BlurUpImage'

const PptRenderer = ({ signedUrl, signedUrls, resource }) => {
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
          <BlurUpImage
            src={signedUrls[resource.content.backgroundImage]}
            alt="Presentation Preview"
            maxWidth="100%"
            maxHeight="100%"
            borderRadius="8px"
          />
        </Box>
      )}
    </Box>
  )
}

export default PptRenderer 