import { TextField, Autocomplete } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'
import { UnitPropTypes } from '../../types/assessmentTypes'

/**
 * Unit selection component
 */
const UnitSelector = ({ units, value, onChange, disabled = false }) => {
  return (
    <Autocomplete
      fullWidth
      size="small"
      options={units}
      getOptionLabel={option => option.name}
      value={units.find(unit => unit._id === value) || null}
      onChange={(_, newValue) => onChange(newValue?._id || null)}
      disabled={disabled}
      renderInput={params => (
        <TextField
          {...params}
          size="small"
          label="Select Unit"
          required
          sx={FORM_FIELD_STYLES.textField}
        />
      )}
    />
  )
}

UnitSelector.propTypes = {
  units: PropTypes.arrayOf(PropTypes.shape(UnitPropTypes)).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default UnitSelector
