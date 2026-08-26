import { Box, Button } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'

/**
 * File-based assessment form component
 */
const FileAssessmentForm = ({ 
  assessmentFile, 
  supportingFile, 
  onAssessmentFileChange, 
  onSupportingFileChange 
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Button
        variant="outlined"
        component="label"
        fullWidth
        sx={{
          height: '36px',
          ...FORM_FIELD_STYLES.button
        }}
      >
        {assessmentFile
          ? assessmentFile.name || 'Assessment File Selected'
          : 'Choose Assessment File'}
        <input
          type="file"
          hidden
          onChange={e => onAssessmentFileChange(e.target.files[0])}
        />
      </Button>
      <Button
        variant="outlined"
        component="label"
        fullWidth
        sx={{
          height: '36px',
          ...FORM_FIELD_STYLES.button
        }}
      >
        {supportingFile
          ? supportingFile.name || 'Supporting File Selected'
          : 'Choose Supporting File'}
        <input
          type="file"
          hidden
          onChange={e => onSupportingFileChange(e.target.files[0])}
        />
      </Button>
    </Box>
  )
}

FileAssessmentForm.propTypes = {
  assessmentFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  supportingFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onAssessmentFileChange: PropTypes.func.isRequired,
  onSupportingFileChange: PropTypes.func.isRequired
}

export default FileAssessmentForm
