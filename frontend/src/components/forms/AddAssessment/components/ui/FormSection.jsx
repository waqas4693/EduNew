import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * Reusable form section wrapper component
 */
const FormSection = ({ title, children, sx = {} }) => {
  return (
    <Box sx={{ ...sx }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {children}
    </Box>
  )
}

FormSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  sx: PropTypes.object
}

export default FormSection
