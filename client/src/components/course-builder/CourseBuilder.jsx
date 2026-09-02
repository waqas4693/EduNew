import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Typography
} from '@mui/material'
import {
  ArrowBack,
  AssessmentOutlined,
  LayersOutlined,
  MenuBookOutlined,
  SettingsOutlined,
  ViewListOutlined
} from '@mui/icons-material'
import { NavLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import AddUnit from '../forms/AddUnit'
import AddSection from '../forms/AddSection'
import AddResource from '../forms/AddResource/index'
import AddAssessment from '../forms/AddAssessment/index'
import { getData, postFormData, putData } from '../../api/api'
import PageShell from '../layout/PageShell'

const BUILDER_TABS = [
  { id: 'overview', label: 'Overview', icon: SettingsOutlined },
  { id: 'units', label: 'Units', icon: ViewListOutlined },
  { id: 'sections', label: 'Sections', icon: LayersOutlined },
  { id: 'resources', label: 'Resources', icon: MenuBookOutlined },
  { id: 'assessments', label: 'Assessments', icon: AssessmentOutlined }
]

const CourseBuilder = () => {
  const { courseId, tab = 'overview' } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [savingOverview, setSavingOverview] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const validTab = useMemo(
    () => BUILDER_TABS.some((item) => item.id === tab),
    [tab]
  )

  const loadCourse = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const courseResponse = await getData(`courses/${courseId}`)
      const courseData = courseResponse.data?.data
      setCourse(courseData)
      setName(courseData?.name || '')

      if (courseData?.thumbnail) {
        const thumbnailResponse = await getData(
          `resources/files/url/THUMBNAILS/${courseData.thumbnail}`
        )
        if (thumbnailResponse.status === 200) {
          setThumbnailPreview(thumbnailResponse.data.signedUrl)
        }
      } else {
        setThumbnailPreview('')
      }
    } catch (error) {
      console.error('Error loading course builder:', error)
      setLoadError(error?.data?.message || 'Unable to load this course.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  const handleOverviewSave = async () => {
    if (!name.trim()) {
      setSnackbar({ open: true, message: 'Course name is required.', severity: 'error' })
      return
    }

    setSavingOverview(true)

    try {
      let thumbnailFileName = undefined

      if (thumbnail) {
        const formData = new FormData()
        formData.append('thumbnail', thumbnail)
        const uploadResponse = await postFormData('upload/thumbnail', formData)
        thumbnailFileName = uploadResponse.data.fileName
      }

      const response = await putData(`courses/${courseId}`, {
        name: name.trim(),
        ...(thumbnailFileName ? { thumbnail: thumbnailFileName } : {})
      })

      if (response.status === 200) {
        setCourse(response.data.data)
        setThumbnail(null)
        if (response.data.data.thumbnail) {
          const thumbnailResponse = await getData(
            `resources/files/url/THUMBNAILS/${response.data.data.thumbnail}`
          )
          if (thumbnailResponse.status === 200) {
            setThumbnailPreview(thumbnailResponse.data.signedUrl)
          }
        }
        setSnackbar({ open: true, message: 'Course details saved.', severity: 'success' })
      }
    } catch (error) {
      console.error('Error saving course overview:', error)
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Unable to save course details.',
        severity: 'error'
      })
    } finally {
      setSavingOverview(false)
    }
  }

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  if (!validTab) {
    return <Navigate to={`/admin/courses/${courseId}/builder/overview`} replace />
  }

  if (loading) {
    return (
      <PageShell kicker="Course Builder" title="Loading course…" contentSx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    )
  }

  if (loadError) {
    return (
      <PageShell kicker="Course Builder" title="Course unavailable" contentSx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/admin/dashboard')}>
          Back to dashboard
        </Button>
      </PageShell>
    )
  }

  const renderTabContent = () => {
    switch (tab) {
      case 'overview':
        return (
          <Box sx={{ maxWidth: 560 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              Course settings
            </Typography>

            <TextField
              fullWidth
              size="small"
              label="Course Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: '8px' }}>
                {thumbnailPreview ? 'Change thumbnail' : 'Upload thumbnail'}
                <input type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
              </Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={savingOverview}
                onClick={handleOverviewSave}
                sx={{ borderRadius: '8px' }}
              >
                {savingOverview ? 'Saving…' : 'Save settings'}
              </Button>
            </Box>

            {thumbnailPreview && (
              <Box
                sx={{
                  width: 200,
                  height: 128,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 18px rgba(10, 37, 64, 0.08)'
                }}
              >
                <img
                  src={thumbnailPreview}
                  alt="Course thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            )}
          </Box>
        )
      case 'units':
        return (
          <AddUnit
            courseId={courseId}
            editMode
            builderMode
            onNotify={(message, severity = 'success') =>
              setSnackbar({ open: true, message, severity })
            }
          />
        )
      case 'sections':
        return (
          <AddSection
            courseId={courseId}
            editMode
            builderMode
            onNotify={(message, severity = 'success') =>
              setSnackbar({ open: true, message, severity })
            }
          />
        )
      case 'resources':
        return (
          <AddResource
            courseId={courseId}
            editMode
            builderMode
            onNotify={(message, severity = 'success') =>
              setSnackbar({ open: true, message, severity })
            }
          />
        )
      case 'assessments':
        return <AddAssessment courseId={courseId} editMode builderMode />
      default:
        return null
    }
  }

  return (
    <PageShell
      kicker="Course Builder"
      title={course?.name || 'Untitled course'}
      subtitle="Manage course content"
      contentSx={{ p: { xs: 1.25, md: 1.5 } }}
      actions={
        <Button
          startIcon={<ArrowBack />}
          size="small"
          onClick={() => navigate('/admin/dashboard')}
          sx={{ borderRadius: '8px', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          variant="outlined"
        >
          Dashboard
        </Button>
      }
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '220px minmax(0, 1fr)' },
          gap: { xs: 1.5, md: 2 },
          alignItems: 'start'
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            borderColor: 'rgba(10, 37, 64, 0.1)',
            position: { lg: 'sticky' },
            top: 16
          }}
        >
          <List dense sx={{ py: 0.5 }}>
            {BUILDER_TABS.map((item) => {
              const Icon = item.icon
              return (
                <ListItemButton
                  key={item.id}
                  component={NavLink}
                  to={`/admin/courses/${courseId}/builder/${item.id}`}
                  sx={{
                    py: 1,
                    '&.active': {
                      bgcolor: 'rgba(31, 126, 194, 0.1)',
                      borderLeft: '3px solid',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <Icon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Paper>

        <Box sx={{ minWidth: 0 }}>{renderTabContent()}</Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageShell>
  )
}

export default CourseBuilder
