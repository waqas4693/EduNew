import { TextField } from '@mui/material'

const CustomTextField = ({ label, register, errors, name, ...props }) => {
  return (
    <TextField
      fullWidth
      label={label}
      margin="normal"
      {...register(name)}
      error={!!errors[name]}
      helperText={errors[name]?.message}
      {...props}
    />
  )
}

export default CustomTextField 