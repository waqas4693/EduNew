import { Alert, Box, Button, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'

const fileLabel = (file, fallback) => {
  if (!file) return fallback
  if (typeof file === 'string') return file
  return file.name || fallback
}

/**
 * File-based assessment form component
 */
const FileAssessmentForm = ({
  assessmentFile,
  supportingFile,
  onAssessmentFileChange,
  onSupportingFileChange,
  readOnly = false
}) => {
  if (readOnly) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Alert severity="info">
          File assessment uploads cannot be changed after creation. Marks, due interval, and roles
          can still be updated.
        </Alert>
        <Typography variant="body2">
          Assessment file: <strong>{fileLabel(assessmentFile, 'None')}</strong>
        </Typography>
        <Typography variant="body2">
          Supporting file: <strong>{fileLabel(supportingFile, 'None')}</strong>
        </Typography>
      </Box>
    )
  }

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
          ? fileLabel(assessmentFile, 'Assessment File Selected')
          : 'Choose Assessment File'}
        <input
          type="file"
          hidden
          onChange={(e) => onAssessmentFileChange(e.target.files[0])}
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
          ? fileLabel(supportingFile, 'Supporting File Selected')
          : 'Choose Supporting File'}
        <input
          type="file"
          hidden
          onChange={(e) => onSupportingFileChange(e.target.files[0])}
        />
      </Button>
    </Box>
  )
}

FileAssessmentForm.propTypes = {
  assessmentFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  supportingFile: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onAssessmentFileChange: PropTypes.func.isRequired,
  onSupportingFileChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool
}

export default FileAssessmentForm
