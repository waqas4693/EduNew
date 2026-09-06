import { Box, Paper } from '@mui/material'
import { usePageChrome } from './LayoutChrome'

/**
 * Content card only. Title/actions register into the sticky layout header.
 */
const PageShell = ({ kicker, title, subtitle, actions, children, contentSx }) => {
  const headerActions = usePageChrome({ kicker, title, subtitle, actions })

  return (
    <>
      {headerActions}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0px 10px 32px rgba(10, 37, 64, 0.08)',
          bgcolor: '#fff'
        }}
      >
        <Box sx={{ p: { xs: 2.5, md: 4 }, ...contentSx }}>{children}</Box>
      </Paper>
    </>
  )
}

export default PageShell
