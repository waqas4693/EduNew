import { Box, Typography } from '@mui/material'
import { useRef, useEffect, useState } from 'react'

const AudioPlayer = ({ src, repeatCount = 1, onPlaybackComplete }) => {
  const audioRef = useRef(null)
  const [playCount, setPlayCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleEnded = () => {
      setPlayCount(prev => {
        const newCount = prev + 1
        if (newCount <= repeatCount) {
          setTimeout(() => {
            audio.currentTime = 0
            audio.play()
          }, 0)
          return newCount
        }
        setIsPlaying(false)
        onPlaybackComplete?.()
        return 0
      })
    }

    const handlePlay = () => {
      if (!isPlaying) {
        setPlayCount(1)
        setIsPlaying(true)
      }
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
    }
  }, [repeatCount, isPlaying, onPlaybackComplete])

  return (
    <Box
      sx={{
        m: 1,
        p: 1,
        display: 'flex',
        bgcolor: '#f5f5f5',
        borderRadius: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2
      }}
    >
      <audio
        controls
        ref={audioRef}
        src={src}
        style={{ width: '100%', maxWidth: '600px' }}
      />
      {playCount > 0 && (
        <Typography
          variant='body1'
          sx={{
            color: 'primary.white',
            fontWeight: 'medium',
            minWidth: '30px',
            textAlign: 'center',
            p: 1,
            borderRadius: 1,
            bgcolor: 'primary.light'
          }}
        >
          {repeatCount - playCount + 1}
        </Typography>
      )}
    </Box>
  )
}

export default AudioPlayer 