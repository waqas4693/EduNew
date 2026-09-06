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
  assessorId = '',
  moderatorId = '',
  verifierId = '',
  onAssessorChange,
  onModeratorChange,
  onVerifierChange,
  disabled = false
}) => {
  const findUser = (users, id) => users.find((user) => String(user._id) === String(id)) || null

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Autocomplete
        fullWidth
        size="small"
        options={assessors}
        value={findUser(assessors, assessorId)}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, value) => String(option._id) === String(value._id)}
        onChange={(_, newValue) => onAssessorChange(newValue?._id || '')}
        disabled={disabled}
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
        value={findUser(moderators, moderatorId)}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, value) => String(option._id) === String(value._id)}
        onChange={(_, newValue) => onModeratorChange(newValue?._id || '')}
        disabled={disabled}
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
        value={findUser(verifiers, verifierId)}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, value) => String(option._id) === String(value._id)}
        onChange={(_, newValue) => onVerifierChange(newValue?._id || '')}
        disabled={disabled}
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
  assessorId: PropTypes.string,
  moderatorId: PropTypes.string,
  verifierId: PropTypes.string,
  onAssessorChange: PropTypes.func.isRequired,
  onModeratorChange: PropTypes.func.isRequired,
  onVerifierChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default RoleSelectionForm
