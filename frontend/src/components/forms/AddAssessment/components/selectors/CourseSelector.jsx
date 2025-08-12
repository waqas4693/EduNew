import { TextField, Autocomplete } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'
import { CoursePropTypes } from '../../types/assessmentTypes'

/**
 * Course selection component
 */
const CourseSelector = ({ courses, value, onChange, disabled = false }) => {
  return (
    <Autocomplete
      fullWidth
      size="small"
      options={courses}
      getOptionLabel={option => option.name}
      value={courses.find(course => course._id === value) || null}
      onChange={(_, newValue) => onChange(newValue?._id || null)}
      disabled={disabled}
      renderInput={params => (
        <TextField
          {...params}
          size="small"
          label="Select Course"
          required
          sx={FORM_FIELD_STYLES.textField}
        />
      )}
    />
  )
}

CourseSelector.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.shape(CoursePropTypes)).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default CourseSelector
