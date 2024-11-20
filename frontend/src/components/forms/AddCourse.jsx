import { useState } from 'react'
import { Box, TextField, Button, Typography, Paper } from '@mui/material'
import { postData } from '../../api/api'

const AddCourse = () => {
  const [name, setName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await postData('courses', { name })
      if (response.status === 201) {
        setName('')
        alert('Course added successfully')
      }
    } catch (error) {
      console.error('Error adding course:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Add New Course</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Course Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth>
            Add Course
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default AddCourse 