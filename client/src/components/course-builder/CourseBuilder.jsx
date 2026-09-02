import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
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
  FolderOutlined,
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
  const [units, setUnits] = useState([])
  const [sectionsByUnit, setSectionsByUnit] = useState({})
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

  const loadCourseTree = useCallback(async () => {
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

      const unitsResponse = await getData(`units/${courseId}`)
      const unitList = unitsResponse.data?.units || []
      setUnits(unitList)

      const sectionEntries = await Promise.all(
        unitList.map(async (unit) => {
          const sectionsResponse = await getData(`sections/${unit._id}`)
          return [unit._id, sectionsResponse.data?.sections || []]
        })
      )

      setSectionsByUnit(Object.fromEntries(sectionEntries))
    } catch (error) {
      console.error('Error loading course builder:', error)
      setLoadError(error?.data?.message || 'Unable to load this course.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadCourseTree()
  }, [loadCourseTree])

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

  const refreshOutline = () => {
    loadCourseTree()
  }

  if (!validTab) {
    return <Navigate to={`/admin/courses/${courseId}/builder/overview`} replace />
  }

  if (loading) {
    return (
      <PageShell kicker="Course Builder" title="Loading course…">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    )
  }

  if (loadError) {
    return (
      <PageShell kicker="Course Builder" title="Course unavailable">
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
          <Paper sx={{ p: 3, borderRadius: '14px' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Course settings
            </Typography>

            <TextField
              fullWidth
              size="small"
              label="Course Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              sx={{ mb: 2, maxWidth: 520, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
              <Button variant="outlined" component="label" sx={{ borderRadius: '8px' }}>
                {thumbnailPreview ? 'Change thumbnail' : 'Upload thumbnail'}
                <input type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
              </Button>
              <Button
                variant="contained"
                color="success"
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
                  width: 220,
                  height: 140,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(10, 37, 64, 0.08)'
                }}
              >
                <img
                  src={thumbnailPreview}
                  alt="Course thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            )}
          </Paper>
        )
      case 'units':
        return (
          <AddUnit
            courseId={courseId}
            editMode
            builderMode
            onStructureChange={refreshOutline}
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
            onStructureChange={refreshOutline}
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
      subtitle="Build and maintain your course structure in one place."
      actions={
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/dashboard')}
          sx={{ borderRadius: '8px' }}
        >
          Dashboard
        </Button>
      }
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
          gap: 3,
          alignItems: 'start'
        }}
      >
        <Paper
          sx={{
            borderRadius: '14px',
            overflow: 'hidden',
            position: { lg: 'sticky' },
            top: 24
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(31, 126, 194, 0.06)' }}>
            <Typography sx={{ fontWeight: 700, color: 'primary.dark' }}>
              Builder sections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Changes stay on this page — refresh-safe via URL.
            </Typography>
          </Box>

          <List sx={{ py: 0 }}>
            {BUILDER_TABS.map((item) => {
              const Icon = item.icon
              return (
                <ListItemButton
                  key={item.id}
                  component={NavLink}
                  to={`/admin/courses/${courseId}/builder/${item.id}`}
                  sx={{
                    '&.active': {
                      bgcolor: 'rgba(31, 126, 194, 0.12)',
                      borderRight: '3px solid',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )
            })}
          </List>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <FolderOutlined fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Course outline
              </Typography>
            </Box>

            {units.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No units yet. Add your first unit to start building.
              </Typography>
            ) : (
              units.map((unit) => (
                <Box key={unit._id} sx={{ mb: 1.5 }}>
                  <Chip
                    size="small"
                    label={`Unit ${unit.number}`}
                    sx={{ mr: 1, mb: 0.5, fontWeight: 700 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {unit.name}
                  </Typography>
                  {(sectionsByUnit[unit._id] || []).length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1 }}>
                      No sections
                    </Typography>
                  ) : (
                    (sectionsByUnit[unit._id] || []).map((section) => (
                      <Typography
                        key={section._id}
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', pl: 1.5, mb: 0.25 }}
                      >
                        {section.number}. {section.name}
                      </Typography>
                    ))
                  )}
                </Box>
              ))
            )}
          </Box>
        </Paper>

        <Box>{renderTabContent()}</Box>
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
