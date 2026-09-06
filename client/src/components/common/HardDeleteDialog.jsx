import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'
import { postData } from '../../api/api'
import { HARD_DELETE_CONSENT, HARD_DELETE_IMPACT } from '../../constants/hardDelete'

const ENTITY_ENDPOINTS = {
  course: 'hard-delete/courses',
  unit: 'hard-delete/units',
  section: 'hard-delete/sections',
  resource: 'hard-delete/resources',
  assessment: 'hard-delete/assessments'
}

const ENTITY_LABELS = {
  course: 'course',
  unit: 'unit',
  section: 'section',
  resource: 'resource',
  assessment: 'assessment'
}

/**
 * Two-step permanent delete dialog:
 * 1) Type exact consent + account password
 * 2) Final confirmation before the API call
 */
const HardDeleteDialog = ({
  open,
  onClose,
  onDeleted,
  entityType,
  entityId,
  entityName = ''
}) => {
  const [step, setStep] = useState('consent')
  const [confirmationText, setConfirmationText] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('consent')
    setConfirmationText('')
    setPassword('')
    setError('')
    setSubmitting(false)
  }, [open, entityId])

  const impact = HARD_DELETE_IMPACT[entityType] || ''
  const label = ENTITY_LABELS[entityType] || 'item'
  const consentMatches = confirmationText === HARD_DELETE_CONSENT
  const canContinue = consentMatches && password.trim().length > 0 && !submitting

  const title = useMemo(() => {
    if (step === 'confirm') return 'Final confirmation'
    return `Permanently delete ${label}`
  }, [step, label])

  const handleClose = () => {
    if (submitting) return
    onClose?.()
  }

  const handleContinue = () => {
    setError('')
    if (!consentMatches) {
      setError('Type the consent message exactly as shown.')
      return
    }
    if (!password.trim()) {
      setError('Enter your account password.')
      return
    }
    setStep('confirm')
  }

  const handleConfirmDelete = async () => {
    const endpointBase = ENTITY_ENDPOINTS[entityType]
    if (!endpointBase || !entityId) {
      setError('Invalid delete target.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await postData(`${endpointBase}/${entityId}`, {
        password,
        confirmationText
      })

      if (response.status === 200) {
        onDeleted?.(response.data)
        onClose?.()
      }
    } catch (err) {
      setStep('consent')
      setError(err?.data?.message || 'Unable to delete. Check your password and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>{title}</DialogTitle>
      <DialogContent>
        {step === 'consent' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
            <Alert severity="error">
              You are about to permanently delete
              {entityName ? (
                <>
                  {' '}
                  <strong>{entityName}</strong>
                </>
              ) : (
                ` this ${label}`
              )}
              .
            </Alert>

            <Typography variant="body2" color="text.secondary">
              {impact}
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Type this exact message to continue:
            </Typography>
            <Box
              sx={{
                p: 1.25,
                borderRadius: '8px',
                bgcolor: 'rgba(211, 47, 47, 0.06)',
                border: '1px solid rgba(211, 47, 47, 0.25)',
                fontFamily: 'monospace',
                fontSize: 13,
                userSelect: 'all'
              }}
            >
              {HARD_DELETE_CONSENT}
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Consent message"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder="Type the message above"
              autoComplete="off"
              error={Boolean(confirmationText) && !consentMatches}
              helperText={
                confirmationText && !consentMatches
                  ? 'Must match the message exactly (including the period).'
                  : ' '
              }
            />

            <TextField
              fullWidth
              size="small"
              type="password"
              label="Your account password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
            <Alert severity="warning">
              This is your last chance to cancel. Permanent deletion will start immediately and
              cannot be reversed.
            </Alert>
            <Typography variant="body2">
              Confirm permanent deletion of{' '}
              <strong>{entityName || `this ${label}`}</strong> and its full hierarchy?
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        {step === 'consent' ? (
          <Button
            variant="contained"
            color="error"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            Continue
          </Button>
        ) : (
          <>
            <Button disabled={submitting} onClick={() => setStep('consent')}>
              Back
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={submitting}
              onClick={handleConfirmDelete}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {submitting ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default HardDeleteDialog
