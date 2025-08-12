import { Box, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'

/**
 * Assessment basic information form component
 */
const AssessmentBasicInfo = ({ title, onTitleChange }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        fullWidth
        size="small"
        label="Assessment Title"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        required
        sx={FORM_FIELD_STYLES.textField}
      />
    </Box>
  )
}

AssessmentBasicInfo.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired
}

export default AssessmentBasicInfo
