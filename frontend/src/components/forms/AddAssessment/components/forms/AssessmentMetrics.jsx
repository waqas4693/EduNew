import { Box, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'

/**
 * Assessment metrics form component (marks, percentage, interval)
 */
const AssessmentMetrics = ({ 
  totalMarks, 
  percentage, 
  interval, 
  remainingPercentage,
  onTotalMarksChange, 
  onPercentageChange, 
  onIntervalChange 
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Total Marks"
        value={totalMarks}
        onChange={e => onTotalMarksChange(e.target.value)}
        required
        sx={FORM_FIELD_STYLES.textField}
      />
      <TextField
        fullWidth
        size="small"
        type="number"
        label={`Percentage (Remaining: ${remainingPercentage}%)`}
        value={percentage}
        onChange={e => onPercentageChange(e.target.value)}
        required
        sx={FORM_FIELD_STYLES.textField}
      />
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Interval (days)"
        value={interval}
        onChange={e => onIntervalChange(e.target.value)}
        required
        sx={FORM_FIELD_STYLES.textField}
      />
    </Box>
  )
}

AssessmentMetrics.propTypes = {
  totalMarks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  interval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  remainingPercentage: PropTypes.number.isRequired,
  onTotalMarksChange: PropTypes.func.isRequired,
  onPercentageChange: PropTypes.func.isRequired,
  onIntervalChange: PropTypes.func.isRequired
}

export default AssessmentMetrics
