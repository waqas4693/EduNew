import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography, keyframes } from '@mui/material'

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const softZoom = keyframes`
  from { transform: scale(1); }
  to { transform: scale(1.06); }
`

const brandReveal = keyframes`
  from {
    opacity: 0;
    letter-spacing: 0.18em;
  }
  to {
    opacity: 1;
    letter-spacing: 0.04em;
  }
`

const COLORS = {
  navy: '#0A2540',
  ink: '#12304A',
  blue: '#1F7EC2',
  blueDeep: '#155A8F',
  paper: '#F5F8FB',
  white: '#FFFFFF'
}

/** Full-bleed custom hero photo (not from existing public assets) */
const HeroBackdrop = () => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      bgcolor: COLORS.navy
    }}
  >
    <Box
      component="img"
      src="/hero-learning.jpg"
      alt=""
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: '62% center',
        animation: `${softZoom} 22s ease-out forwards`,
        transformOrigin: '70% 45%'
      }}
    />
    {/* Readability wash — left for copy, keep photo visible on the right */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: {
          xs: 'linear-gradient(180deg, rgba(7,22,38,0.72) 0%, rgba(7,22,38,0.55) 45%, rgba(7,22,38,0.78) 100%)',
          md: 'linear-gradient(95deg, rgba(7,22,38,0.88) 0%, rgba(7,22,38,0.62) 38%, rgba(7,22,38,0.28) 62%, rgba(7,22,38,0.18) 100%)'
        }
      }}
    />
  </Box>
)

const SplashScreen = () => {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 40)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: COLORS.navy,
        fontFamily: '"Source Sans 3", sans-serif',
        color: COLORS.white,
        overflowX: 'hidden'
      }}
    >
      {/* Hero — one composition */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <HeroBackdrop />

        {/* Top bar */}
        <Box
          component="header"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2.5, md: 5 },
            py: { xs: 2, md: 2.5 }
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="EduSupplements"
            sx={{
              height: { xs: 36, md: 44 },
              width: 'auto',
              maxWidth: { xs: 160, md: 200 },
              objectFit: 'contain',
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(255,255,255,0.94)',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.7s ease'
            }}
          />
          <Button
            onClick={() => navigate('/login')}
            sx={{
              color: COLORS.white,
              textTransform: 'none',
              fontFamily: '"Source Sans 3", sans-serif',
              fontWeight: 600,
              fontSize: { xs: 14, md: 15 },
              px: { xs: 2, md: 2.5 },
              py: 1,
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.35)',
              bgcolor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(6px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.14)',
                borderColor: 'rgba(255,255,255,0.55)'
              }
            }}
          >
            Sign in
          </Button>
        </Box>

        {/* Hero copy */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            px: { xs: 2.5, md: 5 },
            pb: { xs: 8, md: 10 },
            pt: { xs: 4, md: 2 }
          }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Typography
              component="p"
              sx={{
                fontFamily: '"Fraunces", serif',
                fontWeight: 600,
                fontSize: { xs: '2.35rem', sm: '3.25rem', md: '4rem' },
                lineHeight: 1.05,
                color: COLORS.white,
                mb: 1.5,
                animation: ready ? `${brandReveal} 1s ease forwards` : 'none',
                opacity: 0
              }}
            >
              EduSupplements
            </Typography>

            <Typography
              component="h1"
              sx={{
                fontFamily: '"Source Sans 3", sans-serif',
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.65rem' },
                lineHeight: 1.35,
                color: 'rgba(255,255,255,0.95)',
                mb: 1.5,
                maxWidth: 520,
                animation: ready ? `${fadeUp} 0.8s ease 0.2s forwards` : 'none',
                opacity: 0
              }}
            >
              Structured learning that moves with you.
            </Typography>

            <Typography
              sx={{
                fontFamily: '"Source Sans 3", sans-serif',
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.78)',
                mb: 3.5,
                maxWidth: 460,
                animation: ready ? `${fadeUp} 0.8s ease 0.35s forwards` : 'none',
                opacity: 0
              }}
            >
              Courses, units, and assessments in one calm workspace—built for progress you can see.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                animation: ready ? `${fadeUp} 0.8s ease 0.5s forwards` : 'none',
                opacity: 0
              }}
            >
              <Button
                onClick={() => navigate('/login')}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: 15, md: 16 },
                  px: 3.25,
                  py: 1.35,
                  borderRadius: '10px',
                  bgcolor: COLORS.blue,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: COLORS.blueDeep,
                    boxShadow: 'none'
                  }
                }}
              >
                Enter your courses
              </Button>
              <Button
                href="#platform"
                variant="text"
                sx={{
                  textTransform: 'none',
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: 15, md: 16 },
                  color: 'rgba(255,255,255,0.88)',
                  px: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)'
                  }
                }}
              >
                Explore the platform
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Second section — one job: what learners get */}
      <Box
        id="platform"
        component="section"
        sx={{
          bgcolor: COLORS.paper,
          color: COLORS.ink,
          px: { xs: 2.5, md: 5 },
          py: { xs: 6, md: 9 }
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontFamily: '"Fraunces", serif',
            fontWeight: 600,
            fontSize: { xs: '1.75rem', md: '2.15rem' },
            mb: 1,
            color: COLORS.navy
          }}
        >
          Learning that stays clear
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Source Sans 3", sans-serif',
            fontSize: { xs: '1rem', md: '1.05rem' },
            color: 'rgba(10, 37, 64, 0.68)',
            mb: { xs: 4, md: 5 },
            maxWidth: 520
          }}
        >
          Everything in the path is intentional—so students always know what comes next.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 4, md: 5 },
            alignItems: 'start'
          }}
        >
          {[
            {
              icon: '/splash_video.png',
              title: 'Purpose-built lessons',
              text: 'Video and media designed for each topic, with language support so every learner can follow along.'
            },
            {
              icon: '/splash_ai_tutor.png',
              title: 'Practice with guidance',
              text: 'Interactive Q&A and confidence-building practice that keeps learning active, not passive.'
            },
            {
              icon: '/splash_support.png',
              title: 'Support when you need it',
              text: 'Help is available around the clock for course questions and technical issues.'
            }
          ].map((item) => (
            <Box key={item.title} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box
                component="img"
                src={item.icon}
                alt=""
                sx={{
                  width: { xs: 64, md: 75 },
                  height: { xs: 64, md: 75 },
                  objectFit: 'contain',
                  mb: 0.5
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"Fraunces", serif',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                  color: COLORS.navy
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Source Sans 3", sans-serif',
                  fontSize: '0.98rem',
                  lineHeight: 1.55,
                  color: 'rgba(10, 37, 64, 0.7)'
                }}
              >
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: COLORS.ink,
          color: 'rgba(255,255,255,0.75)',
          px: { xs: 2.5, md: 5 },
          py: 3,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Source Sans 3", sans-serif',
            fontSize: 14
          }}
        >
          © {new Date().getFullYear()} EduSupplements
        </Typography>
        <Box
          component="img"
          src="/ehouse-logo.svg"
          alt="Partner"
          sx={{
            height: 28,
            width: 'auto',
            opacity: 0.85,
            filter: 'brightness(0) invert(1)'
          }}
        />
      </Box>
    </Box>
  )
}

export default SplashScreen
