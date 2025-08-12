import { TextField, Autocomplete } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'
import { SectionPropTypes } from '../../types/assessmentTypes'

/**
 * Section selection component
 */
const SectionSelector = ({ sections, value, onChange, disabled = false }) => {
  return (
    <Autocomplete
      fullWidth
      size="small"
      options={sections}
      getOptionLabel={option => option.name}
      value={sections.find(section => section._id === value) || null}
      onChange={(_, newValue) => onChange(newValue?._id || null)}
      disabled={disabled}
      renderInput={params => (
        <TextField
          {...params}
          size="small"
          label="Select Section"
          required
          sx={FORM_FIELD_STYLES.textField}
        />
      )}
    />
  )
}

SectionSelector.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.shape(SectionPropTypes)).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default SectionSelector
