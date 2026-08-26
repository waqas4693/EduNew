import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { ArrowBack } from '@mui/icons-material'

const COLORS = {
  navy: '#0A2540',
  blue: '#1F7EC2',
  blueDeep: '#155A8F',
  paper: '#F5F8FB',
  white: '#FFFFFF',
  line: 'rgba(10, 37, 64, 0.12)'
}

/**
 * Shared chrome for Forgot / Reset / Email verification — matches Login form side.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
  backTo = '/login',
  backLabel = 'Back to sign in'
}) => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Source Sans 3", sans-serif',
        bgcolor: COLORS.paper
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2.5, md: 5 },
          py: 2.5,
          borderBottom: `1px solid ${COLORS.line}`,
          bgcolor: COLORS.white
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="EduSupplements"
          sx={{
            height: { xs: 36, md: 42 },
            width: 'auto',
            maxWidth: 180,
            objectFit: 'contain'
          }}
        />
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(backTo)}
          sx={{
            textTransform: 'none',
            color: COLORS.navy,
            fontWeight: 600,
            fontFamily: '"Source Sans 3", sans-serif'
          }}
        >
          {backLabel}
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 4 },
          py: { xs: 4, md: 6 }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 600,
              fontSize: { xs: '1.85rem', md: '2.1rem' },
              color: COLORS.navy,
              mb: 0.75
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: '0.98rem',
                color: 'rgba(10, 37, 64, 0.62)',
                mb: 3.5,
                lineHeight: 1.55
              }}
            >
              {subtitle}
            </Typography>
          )}

          <Box
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: '14px',
              bgcolor: COLORS.white,
              border: `1px solid ${COLORS.line}`
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          px: { xs: 2.5, md: 5 },
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderTop: `1px solid ${COLORS.line}`,
          bgcolor: COLORS.white
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Source Sans 3", sans-serif',
            fontSize: 13,
            color: 'rgba(10, 37, 64, 0.55)'
          }}
        >
          © {new Date().getFullYear()} EduSupplements
        </Typography>
        <Box
          component="img"
          src="/ehouse-logo.svg"
          alt="Partner"
          sx={{ height: 24, width: 'auto', opacity: 0.75 }}
        />
      </Box>
    </Box>
  )
}

export { COLORS }
export default AuthShell
