import { Box, Chip, Tooltip, Typography } from '@mui/material'

const EnrolledCourses = ({ courses, onViewAll }) => {
  const enrolled = (courses || []).filter((course) => course.courseStatus === 1)

  if (!enrolled.length) {
    return (
      <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
        None enrolled
      </Typography>
    )
  }

  const visible = enrolled.slice(0, 2)
  const extra = enrolled.slice(2)

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {visible.map((course, index) => (
        <Chip
          key={`${course.name}-${index}`}
          label={course.name}
          size="small"
          sx={{
            maxWidth: 180,
            bgcolor: 'rgba(31, 126, 194, 0.1)',
            color: 'primary.dark',
            fontWeight: 600,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }}
        />
      ))}
      {extra.length > 0 && (
        <Tooltip title={extra.map((course) => course.name).join(', ')} placement="top">
          <Chip
            label={`+${extra.length} more`}
            size="small"
            onClick={onViewAll}
            sx={{
              cursor: 'pointer',
              bgcolor: 'rgba(10, 37, 64, 0.08)',
              fontWeight: 600
            }}
          />
        </Tooltip>
      )}
    </Box>
  )
}

export default EnrolledCourses
