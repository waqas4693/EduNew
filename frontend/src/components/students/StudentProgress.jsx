import { Fragment, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ExpandLess from '@mui/icons-material/ExpandLess'
import SyncIcon from '@mui/icons-material/Sync'
import { useQuery } from '@tanstack/react-query'
import { getData } from '../../api/api'
import {
  useStudentCourseUnlockStatus,
  useSyncCourseUnlock,
  useRepairAllCourseUnlocks
} from '../../hooks/useUnlockSync'

const StatusChip = ({ ok, labelOk = 'Yes', labelNo = 'No' }) => (
  <Chip
    size="small"
    color={ok ? 'success' : 'default'}
    label={ok ? labelOk : labelNo}
  />
)

const StudentProgress = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: routeStudentId, courseId: routeCourseId } = useParams()

  const [studentId, setStudentId] = useState(routeStudentId || '')
  const [courseId, setCourseId] = useState(routeCourseId || '')
  const [selectedStudentId, setSelectedStudentId] = useState(routeStudentId || '')
  const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId || '')
  const [expandedSection, setExpandedSection] = useState(null)
  const [studentName, setStudentName] = useState(location.state?.studentName || '')
  const [courseName, setCourseName] = useState(location.state?.courseName || '')

  // When opened from a student course link, status loads automatically via selected* ids

  const { data: students = [] } = useQuery({
    queryKey: ['adminStudentsList'],
    queryFn: async () => {
      const response = await getData('student')
      return response.data?.data?.students || []
    }
  })

  const selectedStudent = useMemo(
    () => students.find((s) => String(s._id) === String(selectedStudentId)),
    [students, selectedStudentId]
  )

  const courses = selectedStudent?.courses || []

  const {
    data: status,
    isLoading,
    isFetching,
    error,
    refetch
  } = useStudentCourseUnlockStatus(selectedStudentId, selectedCourseId, {
    enabled: !!selectedStudentId && !!selectedCourseId
  })

  const syncMutation = useSyncCourseUnlock()
  const repairAllMutation = useRepairAllCourseUnlocks()
  const [repairAllSummary, setRepairAllSummary] = useState(null)

  const handleLoad = () => {
    setSelectedStudentId(studentId)
    setSelectedCourseId(courseId)
    const student = students.find((s) => String(s._id) === String(studentId))
    const courseEntry = student?.courses?.find(
      (c) => String(c.courseId?._id || c.courseId) === String(courseId)
    )
    setStudentName(student?.name || '')
    setCourseName(courseEntry?.name || courseEntry?.courseId?.name || courseName || '')
  }

  const handleSync = async () => {
    if (!selectedStudentId || !selectedCourseId) return
    await syncMutation.mutateAsync({
      studentId: selectedStudentId,
      courseId: selectedCourseId
    })
    await refetch()
  }

  const handleRepairAll = async () => {
    const confirmed = window.confirm(
      'Run one-time repair for ALL active students and courses?\n\n' +
      'This will heal legacy MCQ progress flags and rebuild unlock watermarks from material progress.'
    )
    if (!confirmed) return

    const data = await repairAllMutation.mutateAsync()
    setRepairAllSummary(data.summary)
    if (selectedStudentId && selectedCourseId) {
      await refetch()
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Button
        startIcon={<ChevronLeft />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Student Unlock / Progress Inspector
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This page reads the database directly: material progress, completed markers,
          and the unlock watermark. Use Repair to heal older MCQ/progress data and rebuild
          unlock so the student UI matches the database. Use Repair All once to fix every
          active student after a legacy data mess.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            label="Student"
            size="small"
            sx={{ minWidth: 260 }}
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value)
              setCourseId('')
            }}
          >
            {students.map((student) => (
              <MenuItem key={student._id} value={student._id}>
                {student.name} ({student.email || student._id})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Course"
            size="small"
            sx={{ minWidth: 260 }}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={!studentId}
          >
            {(students.find((s) => String(s._id) === String(studentId))?.courses || []).map((entry) => {
              const id = entry.courseId?._id || entry.courseId
              const name = entry.name || entry.courseId?.name || String(id)
              return (
                <MenuItem key={String(id)} value={id}>
                  {name}
                </MenuItem>
              )
            })}
          </TextField>

          <Button variant="contained" onClick={handleLoad} disabled={!studentId || !courseId}>
            Load Status
          </Button>

          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleSync}
            disabled={!selectedStudentId || !selectedCourseId || syncMutation.isLoading}
          >
            {syncMutation.isLoading ? 'Repairing...' : 'Repair This Student'}
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={<SyncIcon />}
            onClick={handleRepairAll}
            disabled={repairAllMutation.isLoading}
          >
            {repairAllMutation.isLoading ? 'Repairing All...' : 'One-Time Repair All Students'}
          </Button>
        </Box>
      </Paper>

      {(studentName || courseName) && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {studentName || 'Student'} — {courseName || 'Course'}
        </Typography>
      )}

      {syncMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Student repair complete (legacy MCQ heal + unlock rebuild).
        </Alert>
      )}

      {repairAllSummary && (
        <Alert severity="success" sx={{ mb: 2 }}>
          One-time repair finished. Processed {repairAllSummary.processed} course enrollments
          ({repairAllSummary.failed} failed) across {repairAllSummary.studentCount} students.
        </Alert>
      )}

      {syncMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Repair failed. {syncMutation.error?.data?.message || syncMutation.error?.message || ''}
        </Alert>
      )}

      {repairAllMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Repair all failed. {repairAllMutation.error?.data?.message || repairAllMutation.error?.message || ''}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load status.
        </Alert>
      )}

      {(isLoading || isFetching) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {status && !isLoading && (
        <>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Unlock Watermark (CourseUnlock)
            </Typography>
            <Typography variant="body2">Unlocked Unit ID: {status.unlockWatermark.unlockedUnit || 'null'}</Typography>
            <Typography variant="body2">Unlocked Section ID: {status.unlockWatermark.unlockedSection || 'null'}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Next incomplete (contiguous):{' '}
              {status.expectedNextIncomplete
                ? `Unit ${status.expectedNextIncomplete.unitNumber} / Section ${status.expectedNextIncomplete.sectionNumber} — ${status.expectedNextIncomplete.sectionName}`
                : 'None (all contiguous materials complete)'}
            </Typography>
          </Paper>

          {status.units.map((unit) => (
            <Paper key={unit.unitId} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6">
                  Unit {unit.number}: {unit.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <StatusChip ok={unit.materialsComplete} labelOk="Materials complete" labelNo="Materials incomplete" />
                  <StatusChip ok={unit.markedComplete} labelOk="Marked complete" labelNo="Not marked complete" />
                  {unit.mismatch && <Chip size="small" color="warning" label="Mismatch" />}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell>Progress %</TableCell>
                    <TableCell>Materials</TableCell>
                    <TableCell>Marked</TableCell>
                    <TableCell>Mismatch</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unit.sections.map((section) => {
                    const open = expandedSection === section.sectionId
                    return (
                      <Fragment key={section.sectionId}>
                        <TableRow hover>
                          <TableCell>
                            {section.number}. {section.name}
                          </TableCell>
                          <TableCell>
                            {section.resourceProgressPercentage}%
                            {section.mcqProgressPercentage > 0 ? ` / MCQ ${section.mcqProgressPercentage}%` : ''}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {section.viewedCount}/{section.totalResources} resources
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip ok={section.materialsComplete} />
                          </TableCell>
                          <TableCell>
                            <StatusChip ok={section.markedComplete} />
                          </TableCell>
                          <TableCell>
                            {section.mismatch ? <Chip size="small" color="warning" label="Yes" /> : '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              endIcon={open ? <ExpandLess /> : <ExpandMore />}
                              onClick={() =>
                                setExpandedSection(open ? null : section.sectionId)
                              }
                            >
                              Resources
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                            <Collapse in={open}>
                              <Box sx={{ py: 1, px: 1 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>#</TableCell>
                                      <TableCell>Resource</TableCell>
                                      <TableCell>Type</TableCell>
                                      <TableCell>Viewed</TableCell>
                                      <TableCell>MCQ Done</TableCell>
                                      <TableCell>Done</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {section.resources.map((resource) => (
                                      <TableRow key={resource.resourceId}>
                                        <TableCell>{resource.number}</TableCell>
                                        <TableCell>{resource.name}</TableCell>
                                        <TableCell>{resource.resourceType}</TableCell>
                                        <TableCell>{resource.viewed ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>
                                          {resource.resourceType === 'MCQ'
                                            ? resource.mcqCompleted
                                              ? 'Yes'
                                              : 'No'
                                            : '—'}
                                        </TableCell>
                                        <TableCell>{resource.done ? 'Yes' : 'No'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          ))}
        </>
      )}
    </Box>
  )
}

export default StudentProgress
