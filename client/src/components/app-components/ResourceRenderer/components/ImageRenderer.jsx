import { Box } from '@mui/material'
import BlurUpImage from './common/BlurUpImage'

const ImageRenderer = ({ signedUrl, resourceName }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1
      }}
    >
      <BlurUpImage
        src={signedUrl}
        alt={resourceName}
        onContextMenu={(e) => e.preventDefault()}
        maxWidth="100%"
        maxHeight="100%"
        borderRadius="8px"
      />
    </Box>
  )
}

export default ImageRenderer
