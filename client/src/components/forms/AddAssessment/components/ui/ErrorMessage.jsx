import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * Error message component
 */
const ErrorMessage = ({ message }) => {
  if (!message) return null

  return (
    <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
      <Typography color="error.contrastText">
        {message}
      </Typography>
    </Box>
  )
}

ErrorMessage.propTypes = {
  message: PropTypes.string
}

export default ErrorMessage
