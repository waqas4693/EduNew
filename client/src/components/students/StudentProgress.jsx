import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Typography
} from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import { useCourseProgress } from '../../hooks/useCourses'
import PageShell from '../layout/PageShell'

const StudentProgress = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id, studentId, courseId } = useParams()
  const resolvedStudentId = studentId || id
  const courseName = location.state?.courseName || 'Course progress'
  const studentName = location.state?.studentName

  const { data, isLoading, error } = useCourseProgress(resolvedStudentId, courseId)
  const units = data?.units || []
  const overall = data?.progressPercentage || 0

  return (
    <Box>
      <Button startIcon={<ChevronLeft />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>
      <PageShell
        kicker="Progress"
        title={courseName}
        subtitle={
          studentName
            ? `${studentName} · ${data?.completedUnits || 0} of ${data?.totalUnits || units.length} units complete`
            : `${data?.completedUnits || 0} of ${data?.totalUnits || units.length} units complete`
        }
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">Could not load progress for this course.</Typography>
        ) : (
          <>
            <Box sx={{ mb: 3.5 }}>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 1 }}>
                Overall completion
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overall}
                sx={{ height: 10, borderRadius: 5, mb: 0.75 }}
              />
              <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: 'secondary.dark' }}>
                {overall}%
              </Typography>
            </Box>

            {units.length === 0 ? (
              <Typography color="text.secondary">No units found for this course.</Typography>
            ) : (
              units.map((unit) => (
                <Box key={unit._id} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 600, color: 'secondary.dark' }}>
                      Unit {unit.number}: {unit.name}
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                      {unit.progress || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={unit.progress || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))
            )}
          </>
        )}
      </PageShell>
    </Box>
  )
}

export default StudentProgress
