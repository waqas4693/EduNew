import { Button, Typography } from '@mui/material'
import PropTypes from 'prop-types'

const FileUploader = ({ 
  label, 
  onChange, 
  value, 
  accept, 
  editMode, 
  existingFile,
  type = 'primary',
  onView
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      height: '36px',
      borderRadius: '8px',
      padding: '6px 16px',
      overflow: 'hidden',
      flex: 1,
      minWidth: 0
    }

    if (type === 'primary') {
      return {
        ...baseStyles,
        backgroundColor: '#f5f5f5',
        border: '1px solid #20202033'
      }
    }

    return {
      ...baseStyles,
      backgroundColor: '#ffffff',
      border: '1px dashed #20202033'
    }
  }

  const handleFileChange = (event) => {
    if (event?.target?.files?.[0]) {
      onChange(event.target.files[0])
    }
  }

  return (
    <Button
      variant='outlined'
      component='label'
      sx={getButtonStyles()}
    >
      <Typography
        noWrap
        sx={{
          width: '100%',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          maxWidth: '200px',
          display: 'block',
          textTransform: 'none'
        }}
      >
        {editMode && existingFile ? 'Re-Pick' : (value ? (value.name ? (value.name.length > 20 ? `${value.name.slice(0, 20)}...` : value.name) : value) : label)}
      </Typography>
      <input 
        type='file' 
        hidden 
        accept={accept} 
        onChange={handleFileChange}
      />
    </Button>
  )
}

FileUploader.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  accept: PropTypes.string.isRequired,
  editMode: PropTypes.bool,
  existingFile: PropTypes.string,
  type: PropTypes.oneOf(['primary', 'secondary']),
  onView: PropTypes.func
}

export default FileUploader 