import React, { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Slider,
  Button,
  CircularProgress
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'

const MediaViewer = ({ open, onClose, url, type, title }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const mediaRef = useRef(null)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setError(null)
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(false)
    }
  }, [open, url])

  const handleClose = () => {
    if (mediaRef.current) {
      if (type === 'VIDEO' || type === 'AUDIO') {
        mediaRef.current.pause()
        mediaRef.current.currentTime = 0
      }
    }
    setIsPlaying(false)
    setCurrentTime(0)
    onClose()
  }

  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause()
      } else {
        mediaRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (_, newValue) => {
    setVolume(newValue)
    setIsMuted(newValue === 0)
    if (mediaRef.current) {
      mediaRef.current.volume = newValue
      mediaRef.current.muted = newValue === 0
    }
  }

  const handleTimeUpdate = (event) => {
    setCurrentTime(event.target.currentTime)
  }

  const handleLoadedMetadata = (event) => {
    setDuration(event.target.duration)
    setIsLoading(false)
  }

  const handleSeek = (_, newValue) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = newValue
      setCurrentTime(newValue)
    }
  }

  const handleError = (error) => {
    console.error('Media error:', error)
    setError('Error loading media file')
    setIsLoading(false)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const renderMedia = () => {
    if (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        </Box>
      )
    }

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      )
    }

    switch (type) {
      case 'VIDEO':
        return (
          <video
            ref={mediaRef}
            src={url}
            controls={false}
            style={{ width: '100%', maxHeight: '70vh' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
          />
        )
      case 'AUDIO':
        return (
          <Box sx={{ width: '100%', p: 2 }}>
            <audio
              ref={mediaRef}
              src={url}
              controls={false}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
            />
          </Box>
        )
      case 'IMAGE':
        return (
          <img
            src={url}
            alt={title}
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            onLoad={() => setIsLoading(false)}
            onError={handleError}
          />
        )
      case 'PDF':
        return (
          <iframe
            src={url}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title={title}
            sandbox="allow-same-origin allow-scripts allow-forms"
            onLoad={() => setIsLoading(false)}
            onError={handleError}
          />
        )
      case 'PPT':
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title={title}
            sandbox="allow-same-origin allow-scripts allow-forms"
            onLoad={() => setIsLoading(false)}
            onError={handleError}
          />
        )
      default:
        return (
          <Typography variant="body1" color="error">
            Unsupported media type
          </Typography>
        )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {renderMedia()}
        {(type === 'VIDEO' || type === 'AUDIO') && !error && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handlePlayPause}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: '100px' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
              <Slider
                value={currentTime}
                max={duration}
                onChange={handleSeek}
                sx={{ flex: 1 }}
              />
              <IconButton onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
              <Slider
                value={volume}
                min={0}
                max={1}
                step={0.1}
                onChange={handleVolumeChange}
                sx={{ width: '100px' }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default MediaViewer 