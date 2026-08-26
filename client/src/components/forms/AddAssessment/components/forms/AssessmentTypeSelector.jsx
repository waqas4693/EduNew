import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { ASSESSMENT_TYPES, FORM_FIELD_STYLES } from '../../utils/constants'

/**
 * Assessment type selection component
 */
const AssessmentTypeSelector = ({ value, onChange, disabled = false }) => {
  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel sx={{ color: '#8F8F8F', backgroundColor: 'white', padding: '0 4px' }}>
        Assessment Type
      </InputLabel>
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        sx={FORM_FIELD_STYLES.select}
      >
        {ASSESSMENT_TYPES.map(type => (
          <MenuItem key={type.value} value={type.value}>
            {type.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

AssessmentTypeSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default AssessmentTypeSelector
