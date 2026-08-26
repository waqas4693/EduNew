import { TextField } from '@mui/material'

const NumberInput = ({ value, onChange, min = 1, max = 999, disabled = false, error, helperText }) => {
  return (
    <TextField
      type="number"
      value={value}
      onChange={(e) => {
        const newValue = parseInt(e.target.value)
        if (newValue >= min && newValue <= max) {
          onChange(newValue)
        }
      }}
      disabled={disabled}
      error={error}
      helperText={helperText}
      size="small"
      sx={{
        width: '80px',
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px'
        }
      }}
    />
  )
}

export default NumberInput 