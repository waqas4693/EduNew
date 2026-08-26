import { Box, TextField, FormControl, FormControlLabel, Switch } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'

/**
 * Time options form component for time-bound assessments
 */
const TimeOptionsForm = ({ 
  isTimeBound, 
  timeAllowed, 
  onTimeBoundChange, 
  onTimeAllowedChange,
  showTimeOptions = true,
  disabled = false
}) => {
  if (!showTimeOptions) return null

  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isTimeBound}
              onChange={(e) => onTimeBoundChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label="Time Bound Assessment"
        />
      </FormControl>

      {isTimeBound && (
        <TextField
          fullWidth
          type="number"
          size="small"
          label="Time Allowed (minutes)"
          value={timeAllowed}
          onChange={(e) => onTimeAllowedChange(e.target.value)}
          disabled={disabled}
          sx={FORM_FIELD_STYLES.textField}
        />
      )}
    </Box>
  )
}

TimeOptionsForm.propTypes = {
  isTimeBound: PropTypes.bool.isRequired,
  timeAllowed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onTimeBoundChange: PropTypes.func.isRequired,
  onTimeAllowedChange: PropTypes.func.isRequired,
  showTimeOptions: PropTypes.bool,
  disabled: PropTypes.bool
}

export default TimeOptionsForm
