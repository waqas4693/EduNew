import { Box, TextField, Autocomplete } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES } from '../../utils/constants'
import { UserPropTypes } from '../../types/assessmentTypes'

/**
 * Role selection form component for assessor, moderator, and verifier
 */
const RoleSelectionForm = ({ 
  assessors, 
  moderators, 
  verifiers, 
  onAssessorChange, 
  onModeratorChange, 
  onVerifierChange 
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Autocomplete
        fullWidth
        size="small"
        options={assessors}
        getOptionLabel={(option) => option.name}
        onChange={(_, newValue) => onAssessorChange(newValue?._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Assessor"
            required
            sx={FORM_FIELD_STYLES.textField}
          />
        )}
      />

      <Autocomplete
        fullWidth
        size="small"
        options={moderators}
        getOptionLabel={(option) => option.name}
        onChange={(_, newValue) => onModeratorChange(newValue?._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Moderator"
            required
            sx={FORM_FIELD_STYLES.textField}
          />
        )}
      />

      <Autocomplete
        fullWidth
        size="small"
        options={verifiers}
        getOptionLabel={(option) => option.name}
        onChange={(_, newValue) => onVerifierChange(newValue?._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Verifier"
            required
            sx={FORM_FIELD_STYLES.textField}
          />
        )}
      />
    </Box>
  )
}

RoleSelectionForm.propTypes = {
  assessors: PropTypes.arrayOf(PropTypes.shape(UserPropTypes)).isRequired,
  moderators: PropTypes.arrayOf(PropTypes.shape(UserPropTypes)).isRequired,
  verifiers: PropTypes.arrayOf(PropTypes.shape(UserPropTypes)).isRequired,
  onAssessorChange: PropTypes.func.isRequired,
  onModeratorChange: PropTypes.func.isRequired,
  onVerifierChange: PropTypes.func.isRequired
}

export default RoleSelectionForm
