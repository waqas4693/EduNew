import { Box, Paper, Typography } from '@mui/material'
import { LayoutChromeButtons, useClaimLayoutChrome } from './LayoutChrome'

const PageShell = ({ kicker, title, subtitle, actions, children }) => {
  useClaimLayoutChrome()

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0px 10px 32px rgba(10, 37, 64, 0.08)',
        bgcolor: '#fff'
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2.25 },
          background: 'linear-gradient(135deg, #1F7EC2 0%, #155A8F 55%, #0A2540 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <LayoutChromeButtons light />
          <Box sx={{ minWidth: 0 }}>
            {kicker && (
              <Typography
                sx={{
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.82
                }}
              >
                {kicker}
              </Typography>
            )}
            <Typography
              sx={{
                fontFamily: '"Fraunces", serif',
                fontWeight: 600,
                fontSize: { xs: '1.35rem', md: '1.55rem' },
                lineHeight: 1.2
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ mt: 0.35, fontSize: 13.5, opacity: 0.88 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions}
      </Box>
      <Box sx={{ p: { xs: 2.5, md: 4 } }}>{children}</Box>
    </Paper>
  )
}

export default PageShell
