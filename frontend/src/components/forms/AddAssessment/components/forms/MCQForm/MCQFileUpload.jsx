import { Box, Button, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../../utils/constants'
// Utility function for truncating file names
const truncateFileName = (fileName, maxLength = 5) => {
  if (!fileName) return ''
  const extension = fileName.split('.').pop()
  const name = fileName.split('.').slice(0, -1).join('.')
  if (name.length <= maxLength) return fileName
  return `${name.substring(0, maxLength)}...${extension}`
}

/**
 * MCQ file upload component for image and audio files
 */
const MCQFileUpload = ({ 
  imageFile, 
  audioFile, 
  onImageChange, 
  onAudioChange 
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
      <Button
        variant="outlined"
        component="label"
        sx={{
          height: '40px',
          minWidth: '150px',
          ...FORM_FIELD_STYLES.button
        }}
      >
        <Typography 
          sx={{ 
            maxWidth: '130px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {imageFile ? truncateFileName(imageFile.name || 'Image') : 'Add Image'}
        </Typography>
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={e => onImageChange(e.target.files[0])}
        />
      </Button>
      
      <Button
        variant="outlined"
        component="label"
        sx={{
          height: '40px',
          minWidth: '150px',
          ...FORM_FIELD_STYLES.button
        }}
      >
        <Typography 
          sx={{ 
            maxWidth: '130px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {audioFile ? truncateFileName(audioFile.name || 'Audio') : 'Add Audio'}
        </Typography>
        <input
          type="file"
          hidden
          accept="audio/*"
          onChange={e => onAudioChange(e.target.files[0])}
        />
      </Button>
    </Box>
  )
}

MCQFileUpload.propTypes = {
  imageFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  audioFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onImageChange: PropTypes.func.isRequired,
  onAudioChange: PropTypes.func.isRequired
}

export default MCQFileUpload
