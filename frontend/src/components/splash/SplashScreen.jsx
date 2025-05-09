import Grid from '@mui/material/Grid2'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Menu, MenuItem, Container } from '@mui/material'
import { School, AdminPanelSettings, ArrowDropDown } from '@mui/icons-material'

const HeaderSection = () => {
  const navigate = useNavigate()
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
        // top: 16, 
        right: 10, 
        zIndex: 1
      }}>
        <Button
          onClick={handleClick}
          sx={{
            color: '#BC0000',
            fontWeight: 'bold',
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
          height: { xs: '80px', md: '100px' },
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Box
          sx={{
            mr: 3,
            width: { xs: '5%', md: '10%' },
            height: '35px',
            background: 'linear-gradient(90deg, #ff2b0c 0%, #ff6b0c 100%)'
          }}
        />
        <Box
          component='img'
          alt='Logo'
          src='/logo.png'
          sx={{
            px: 1,
            width: { xs: '20%', md: '15%' },
            height: '100%',
            objectFit: 'contain'
          }}
        />
        <Box
          sx={{
            ml: 3,
            flexGrow: 1,
            height: '35px',
            background: 'linear-gradient(90deg, #ff2b0c 0%, #ff6b0c 100%)'
          }}
        />
      </Box>
    </Box>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
    <Box
      component='img'
      src={icon}
      alt={title}
      sx={{ width: 90, height: 90, mr: 1, flexShrink: 0 }}
    />
    <Box sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.3, pt: '15px' }}>
      {description}
    </Box>
  </Box>
)

const FooterStrip = () => (
  <Box
    sx={{
      width: '100%',
      height: { xs: '80px', md: '100px' },
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#ffffff',
    }}
  >
    <Box
      sx={{
        mr: 3,
        width: { xs: '50%', md: '75%' },
        height: '35px',
        background: 'linear-gradient(90deg, #0070c0 0%, #00a0c0 100%)'
      }}
    />
    <Box
      component='img'
      alt='Logo'
      src='/ehouse-logo.svg'
      sx={{
        px: 1,
        width: { xs: '15%', md: '10%' },
        height: '90%',
        objectFit: 'contain'
      }}
    />
    <Box
      sx={{
        ml: 3,
        flexGrow: 1,
        height: '35px',
        background: 'linear-gradient(90deg, #0070c0 0%, #00a0c0 100%)'
      }}
    />
  </Box>
)

const SplashScreen = () => {
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
        height: '100vh',
        display: 'flex',
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
          py: 2
        }}
      >
        <Grid container spacing={2}>
          {/* Main Logo Section */}
          <Grid size={12}>
            <Box
              sx={{
                mb: '40px',
                width: '100%',
                height: { xs: '100px', md: '200px' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
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
            <Grid container spacing={2}>
              {features.map((feature, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={index}>
                  <FeatureCard {...feature} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <FooterStrip />
    </Box>
  )
}

export default SplashScreen 