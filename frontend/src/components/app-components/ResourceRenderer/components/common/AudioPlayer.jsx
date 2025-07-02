import { Box, Typography } from '@mui/material'
import { useRef, useEffect, useState } from 'react'

const AudioPlayer = ({ src, repeatCount = 1, onPlaybackComplete }) => {
  console.log('=== AudioPlayer Component Initialized ===')
  console.log('Props:', { src, repeatCount, hasOnPlaybackComplete: !!onPlaybackComplete })
  
  const audioRef = useRef(null)
  const [playCount, setPlayCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  console.log('Initial state:', { playCount, isPlaying })

  useEffect(() => {
    console.log('=== AudioPlayer useEffect ===')
    console.log('Setting up audio event listeners')
    
    if (!audioRef.current) {
      console.log('Audio ref not available yet')
      return
    }

    const audio = audioRef.current
    console.log('Audio element found, setting up listeners')

    const handleEnded = () => {
      console.log('=== Audio Ended Event ===')
      console.log('Current play count:', playCount)
      console.log('Repeat count:', repeatCount)
      
      setPlayCount(prev => {
        const newCount = prev + 1
        console.log('New play count:', newCount)
        
        if (newCount <= repeatCount) {
          console.log('Repeating audio playback')
          setTimeout(() => {
            console.log('Restarting audio playback')
            audio.currentTime = 0
            audio.play()
          }, 0)
          return newCount
        }
        
        console.log('Audio playback completed, calling onPlaybackComplete')
        setIsPlaying(false)
        onPlaybackComplete?.()
        return 0
      })
    }

    const handlePlay = () => {
      console.log('=== Audio Play Event ===')
      console.log('Current playing state:', isPlaying)
      
      if (!isPlaying) {
        console.log('Starting audio playback, setting play count to 1')
        setPlayCount(1)
        setIsPlaying(true)
      } else {
        console.log('Audio already playing, not updating state')
      }
    }

    console.log('Adding event listeners to audio element')
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)

    return () => {
      console.log('=== AudioPlayer Cleanup ===')
      console.log('Removing audio event listeners')
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
    }
  }, [repeatCount, isPlaying, onPlaybackComplete])

  console.log('=== AudioPlayer Rendering ===')
  console.log('Render state:', { playCount, isPlaying, repeatCount })
  
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