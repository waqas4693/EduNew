import { Box } from '@mui/material'

const ImageRenderer = ({ signedUrl, resourceName }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <img
        src={signedUrl}
        alt={resourceName}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </Box>
  )
}

export default ImageRenderer 