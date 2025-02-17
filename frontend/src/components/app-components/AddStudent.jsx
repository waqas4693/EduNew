import CustomTextField from '../reusable-components/CustomTextField'

import { useState } from 'react'
import { postData } from '../../api/api'
import { useForm } from 'react-hook-form'
import { Box, Button, Typography, Paper } from '@mui/material'

const AddStudent = () => {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const response = await postData('student', data)

      if (response.status === 201) {
        reset()
        alert('Student added successfully')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Add New Student
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomTextField
            label="Name"
            name="name"
            register={register}
            errors={errors}
            required
          />

          <CustomTextField
            label="Email"
            name="email"
            register={register}
            errors={errors}
            type="email"
            required
            pattern={{
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }}
          />

          <CustomTextField
            label="Password"
            name="password"
            register={register}
            errors={errors}
            type="password"
            required
            minLength={{
              value: 6,
              message: 'Password must be at least 6 characters'
            }}
          />

          <CustomTextField
            label="Contact Number"
            name="contactNo"
            register={register}
            errors={errors}
            required
          />

          <CustomTextField
            label="Address"
            name="address"
            register={register}
            errors={errors}
            multiline
            rows={3}
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Student'}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default AddStudent
