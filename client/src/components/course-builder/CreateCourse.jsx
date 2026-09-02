import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, TextField } from '@mui/material'
import { getData, postData, postFormData } from '../../api/api'
import PageShell from '../layout/PageShell'

const CreateCourse = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview)
      }
    }
  }, [thumbnailPreview])

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a course name.')
      return
    }

    setSaving(true)

    try {
      let thumbnailFileName = null

      if (thumbnail) {
        const formData = new FormData()
        formData.append('thumbnail', thumbnail)
        const uploadResponse = await postFormData('upload/thumbnail', formData)
        thumbnailFileName = uploadResponse.data.fileName
      }

      const response = await postData('courses', {
        name: name.trim(),
        thumbnail: thumbnailFileName
      })

      if (response.status === 201) {
        navigate(`/admin/courses/${response.data.data._id}/builder/units`, { replace: true })
      }
    } catch (submitError) {
      console.error('Error creating course:', submitError)
      setError(submitError?.data?.message || 'Unable to create course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      kicker="Courses"
      title="Create Course"
      subtitle="Start with the basics, then build units, sections, and resources in the course builder."
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 640 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          size="small"
          label="Course Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" component="label" sx={{ borderRadius: '8px' }}>
            Upload Thumbnail
            <input type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            sx={{ borderRadius: '8px', minWidth: 140 }}
          >
            {saving ? 'Creating…' : 'Create & Build'}
          </Button>
        </Box>

        {thumbnailPreview && (
          <Box
            sx={{
              mt: 3,
              width: 180,
              height: 120,
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(10, 37, 64, 0.08)'
            }}
          >
            <img
              src={thumbnailPreview}
              alt="Thumbnail preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}
      </Box>
    </PageShell>
  )
}

export default CreateCourse
