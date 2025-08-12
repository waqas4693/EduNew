import { Box, Button } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * Submit button component with loading state
 */
const SubmitButton = ({ isSubmitting, disabled, onClick, sx = {} }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', ...sx }}>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting || disabled}
        onClick={onClick}
        sx={{ mt: 2 }}
      >
        {isSubmitting ? 'Creating Assessment...' : 'Create Assessment'}
      </Button>
    </Box>
  )
}

SubmitButton.propTypes = {
  isSubmitting: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  sx: PropTypes.object
}

export default SubmitButton
