import { useState, useEffect, useRef } from 'react'
import { Box } from '@mui/material'

/**
 * Shows a soft blur/placeholder until the image finishes loading, then sharpens.
 */
const BlurUpImage = ({
  src,
  alt = '',
  onContextMenu,
  maxHeight = '100%',
  maxWidth = '100%',
  borderRadius = 0,
  sx = {},
  imgStyle = {}
}) => {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    setLoaded(false)
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [src])

  if (!src) return null

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: 'rgba(10, 37, 64, 0.06)',
        borderRadius,
        ...sx
      }}
    >
      <Box
        component="img"
        ref={imgRef}
        src={src}
        alt={alt}
        onContextMenu={onContextMenu}
        onLoad={() => setLoaded(true)}
        sx={{
          maxWidth,
          maxHeight,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: loaded ? 'blur(0px)' : 'blur(18px)',
          transform: loaded ? 'scale(1)' : 'scale(1.04)',
          opacity: loaded ? 1 : 0.85,
          transition: 'filter 0.45s ease, transform 0.45s ease, opacity 0.35s ease',
          ...imgStyle
        }}
      />
    </Box>
  )
}

export default BlurUpImage
