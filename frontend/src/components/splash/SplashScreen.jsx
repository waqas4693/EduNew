import Grid from '@mui/material/Grid2'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Menu, MenuItem, Container, useTheme, useMediaQuery } from '@mui/material'
import { School, AdminPanelSettings, ArrowDropDown } from '@mui/icons-material'

const HeaderSection = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogin = (type) => {
    handleClose()
    navigate('/login')
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Login Button */}
      <Box sx={{ 
        position: 'absolute', 
        right: 0.2,
        zIndex: 1
      }}>
        <Button
          onClick={handleClick}
          size={isMobile ? 'small' : 'medium'}
          sx={{
            color: '#BC0000',
            fontWeight: 'bold',
            fontSize: { xs: '12px', sm: '14px' },
          }}
          endIcon={<ArrowDropDown />}
        >
          Login
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              '& .MuiMenuItem-root': {
                color: '#1F7EC2',
                fontSize: { xs: '14px', sm: '16px' },
                minHeight: { xs: '44px', sm: '48px' },
                '&:hover': {
                  backgroundColor: 'rgba(31, 126, 194, 0.1)',
                },
              },
            },
          }}
        >
          <MenuItem onClick={() => handleLogin('student')}>
            <School sx={{ mr: 1, color: '#1F7EC2' }} /> Student
          </MenuItem>
          <MenuItem onClick={() => handleLogin('admin')}>
            <AdminPanelSettings sx={{ mr: 1, color: '#1F7EC2' }} /> Admin
          </MenuItem>
        </Menu>
      </Box>

      {/* Gradient Strip */}
      <Box
        sx={{
          width: '100%',
          height: { xs: '70px', sm: '80px', md: '100px' },
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Box
          sx={{
            mr: { xs: 1, sm: 2, md: 3 },
            width: { xs: '8%', sm: '6%', md: '10%' },
            height: { xs: '25px', sm: '30px', md: '35px' },
            background: 'linear-gradient(90deg, #ff2b0c 0%, #ff6b0c 100%)'
          }}
        />
        <Box
          component='img'
          alt='Logo'
          src='/logo.png'
          sx={{
            px: { xs: 0.5, sm: 1 },
            width: { xs: '25%', sm: '22%', md: '15%' },
            height: '100%',
            objectFit: 'contain'
          }}
        />
        <Box
          sx={{
            ml: { xs: 1, sm: 2, md: 3 },
            flexGrow: 1,
            height: { xs: '25px', sm: '30px', md: '35px' },
            background: 'linear-gradient(90deg, #ff2b0c 0%, #ff6b0c 100%)'
          }}
        />
      </Box>
    </Box>
  )
}

const FeatureCard = ({ icon, title, description }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      flex: 1, 
      minWidth: 0,
      flexDirection: { xs: 'column', sm: 'row' },
      textAlign: { xs: 'center', sm: 'left' },
      mb: { xs: 3, sm: 0 }
    }}>
      <Box
        component='img'
        src={icon}
        alt={title}
        sx={{ 
          width: { xs: 70, sm: 60, md: 90 }, 
          height: { xs: 70, sm: 60, md: 90 }, 
          mr: { xs: 0, sm: 1, md: 1 }, 
          mb: { xs: 1, sm: 0 },
          flexShrink: 0,
          alignSelf: { xs: 'center', sm: 'flex-start' }
        }}
      />
      <Box sx={{ 
        fontSize: { xs: 10, sm: 9, md: 10 },
        color: 'text.secondary', 
        lineHeight: { xs: 1.3, sm: 1.2, md: 1.3 },
        pt: { xs: 0, sm: '15px' },
        px: { xs: 1, sm: 0 }
      }}>
        {description}
      </Box>
    </Box>
  )
}

// Mobile/Tablet Slider Component
const FeatureSlider = ({ features }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto-advance slides every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [features.length])

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Slider Container */}
      <Box
        sx={{
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          minHeight: { xs: '200px', sm: '180px' },
        }}
      >
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              minWidth: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease-in-out',
              transform: `translateX(-${currentSlide * 100}%)`
            }}
          >
            <FeatureCard {...feature} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const FooterStrip = () => (
  <Box
    sx={{
      width: '100%',
      height: { xs: '70px', sm: '80px', md: '100px' },
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#ffffff',
    }}
  >
    <Box
      sx={{
        mr: { xs: 1, sm: 2, md: 3 },
        width: { xs: '45%', sm: '60%', md: '75%' },
        height: { xs: '25px', sm: '30px', md: '35px' },
        background: 'linear-gradient(90deg, #0070c0 0%, #00a0c0 100%)'
      }}
    />
    <Box
      component='img'
      alt='Logo'
      src='/ehouse-logo.svg'
      sx={{
        px: { xs: 0.5, sm: 1 },
        width: { xs: '20%', sm: '15%', md: '10%' },
        height: '90%',
        objectFit: 'contain'
      }}
    />
    <Box
      sx={{
        ml: { xs: 1, sm: 2, md: 3 },
        flexGrow: 1,
        height: { xs: '25px', sm: '30px', md: '35px' },
        background: 'linear-gradient(90deg, #0070c0 0%, #00a0c0 100%)'
      }}
    />
  </Box>
)

const SplashScreen = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const features = [
    {
      icon: '/splash_ai_tutor.png',
      title: 'AI Tutor',
      description: (
        <>
          <span>
            <span style={{ fontWeight: 'bold' }}>Q&amp;A Practice</span> – Learn through interactive question &amp; answer sessions powered by AI for a more engaging experience.
          </span>
          <span style={{ display: 'block', marginTop: 6 }}>
            <span style={{ fontWeight: 'bold' }}>Confidence Building</span> – Boost your confidence, especially in English, using psychological techniques guided and monitored by AI.
          </span>
        </>
      )
    },
    {
      icon: '/splash_video.png',
      title: 'Video Lectures',
      description: (
        <>
          <span>
            <span style={{ fontWeight: 'bold' }}>Purpose-Built Videos</span> – Watch video lectures created specifically for our courses to help you understand each topic clearly.
          </span>
          <span style={{ display: 'block', marginTop: 6 }}>
            <span style={{ fontWeight: 'bold' }}>Language Support</span> – All videos come with multi-language options so learners from different backgrounds can follow along easily.
          </span>
        </>
      )
    },
    {
      icon: '/splash_support.png',
      title: '24/7 Support',
      description: (
        <span>
          <span style={{ fontWeight: 'bold' }}>Get help anytime you need it.</span> Whether it's a question about your course or a technical issue, our support team is available 24/7 to assist you.
        </span>
      )
    }
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
      }}
    >
      <HeaderSection />
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: { xs: 1, sm: 2, md: 3 },
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
          {/* Main Logo Section */}
          <Grid size={12}>
            <Box
              sx={{
                mb: { xs: 2, sm: 3, md: '40px' },
                width: '100%',
                height: { xs: '150px', sm: '200px', md: '180px' }, // Enlarged for mobile/tablet
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component='img'
                src='/edu-cover1.jpg'
                alt='Educational Supplements'
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Grid>

          {/* Features Section */}
          <Grid size={12}>
            {/* Mobile/Tablet Slider */}
            {(isMobile || isTablet) && (
              <FeatureSlider features={features} />
            )}
            
            {/* Desktop Grid Layout - Unchanged */}
            {isDesktop && (
              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid size={4} key={index}>
                    <FeatureCard {...feature} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      <FooterStrip />
    </Box>
  )
}

export default SplashScreen 