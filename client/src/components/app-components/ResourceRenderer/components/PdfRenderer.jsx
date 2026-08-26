import { Box, Typography } from '@mui/material'
import AudioPlayer from './common/AudioPlayer'

const PdfRenderer = ({ signedUrl, signedUrls, resource }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {/* Audio Player for PDF */}
      {resource.content.audioFile && signedUrls[resource.content.audioFile] && (
        <Box sx={{ 
          width: '100%', 
          p: 2, 
          bgcolor: 'grey.100', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Audio Narration
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            bgcolor: 'white',
            p: 1,
            borderRadius: '8px'
          }}>
            <AudioPlayer
              src={signedUrls[resource.content.audioFile]}
              repeatCount={resource.content.audioRepeatCount || 1}
            />
          </Box>
        </Box>
      )}

      {/* PDF Viewer */}
      <Box sx={{ width: '100%', height: '70vh' }}>
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px'
          }}
          title="PDF Viewer"
        />
      </Box>
    </Box>
  )
}

export default PdfRenderer 