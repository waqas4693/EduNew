import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { FORM_FIELD_STYLES, MCQ_CONSTRAINTS } from '../../../utils/constants'

/**
 * MCQ options management component
 */
const MCQOptions = ({ 
  options, 
  optionCount,
  onOptionChange, 
  onSetTotalOptions,
  mcqIndex
}) => {
  // Generate array for option count dropdown (2 to 6)
  const optionCountOptions = Array.from(
    { length: MCQ_CONSTRAINTS.MAX_OPTIONS - MCQ_CONSTRAINTS.MIN_OPTIONS + 1 }, 
    (_, i) => MCQ_CONSTRAINTS.MIN_OPTIONS + i
  )

  return (
    <Box>
      {/* Total Options Selector */}
      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>Total Options</InputLabel>
        <Select
          value={optionCount}
          onChange={(e) => onSetTotalOptions(mcqIndex, e.target.value)}
          label="Total Options"
          sx={FORM_FIELD_STYLES.select}
        >
          {optionCountOptions.map((count) => (
            <MenuItem key={count} value={count}>
              {count} Options
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* MCQ Options - 2 per row */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: Math.ceil(options.length / 2) }).map((_, rowIndex) => {
          const firstOptionIndex = rowIndex * 2
          const secondOptionIndex = firstOptionIndex + 1
          const hasSecondOption = secondOptionIndex < options.length

          return (
            <Box key={rowIndex} sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <TextField
                size="small"
                label={`Option ${firstOptionIndex + 1}`}
                value={options[firstOptionIndex] || ''}
                onChange={e => onOptionChange(mcqIndex, firstOptionIndex, e.target.value)}
                sx={{
                  flex: 1,
                  ...FORM_FIELD_STYLES.textField
                }}
              />
              {hasSecondOption && (
                <TextField
                  size="small"
                  label={`Option ${secondOptionIndex + 1}`}
                  value={options[secondOptionIndex] || ''}
                  onChange={e => onOptionChange(mcqIndex, secondOptionIndex, e.target.value)}
                  sx={{
                    flex: 1,
                    ...FORM_FIELD_STYLES.textField
                  }}
                />
              )}
              {!hasSecondOption && <Box sx={{ flex: 1 }} />}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

MCQOptions.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  optionCount: PropTypes.number.isRequired,
  onOptionChange: PropTypes.func.isRequired,
  onSetTotalOptions: PropTypes.func.isRequired,
  mcqIndex: PropTypes.number.isRequired
}

export default MCQOptions
