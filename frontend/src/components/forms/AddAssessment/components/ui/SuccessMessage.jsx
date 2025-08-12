import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * Success message component
 */
const SuccessMessage = ({ message }) => {
  if (!message) return null

  return (
    <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
      <Typography color="success.contrastText">
        {message}
      </Typography>
    </Box>
  )
}

SuccessMessage.propTypes = {
  message: PropTypes.string
}

export default SuccessMessage
