import { Box } from '@mui/material'

const VideoRenderer = ({ signedUrl }) => {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '80vh' }}>
      <video
        controls
        controlsList="nodownload"
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
}

export default VideoRenderer 