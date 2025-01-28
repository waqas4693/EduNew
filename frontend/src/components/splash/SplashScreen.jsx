import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Menu, MenuItem, keyframes } from '@mui/material'
import { School, AdminPanelSettings, ArrowDropDown } from '@mui/icons-material'

const blink = keyframes`
  0% { opacity: 1; }
  25% { opacity: 0.5; }
  50% { opacity: 0; }
  75% { opacity: 0.5; }
  100% { opacity: 1; }
`

const SplashScreen = () => {
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
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}
    >
      <Button
        onClick={handleClick}
        sx={{
          position: 'absolute',
          top: '3px',
          right: '20px',
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

      <Box
        sx={{
          width: '100%',
          height: '150px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            width: '10%',
            height: '50%',
            backgroundColor: '#BC0000'
          }}
        />
        <Box
          alt='Logo'
          src='/logo.png'
          component='img'
          sx={{
            width: '20%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
        <Box
          sx={{
            flexGrow: 1,
            height: '50%',
            backgroundColor: '#BC0000'
          }}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: '80%',
            height: '300',
            display: 'flex',
            maxWidth: '800px',
            overflow: 'hidden',
            alignItems: 'center',
            position: 'relative',
            justifyContent: 'center'
          }}
        >
          <Box
            src='/edu-cover.jpg'
            component='img'
            alt='Educational Supplements'
            sx={{
              width: '80%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: '70px',
          backgroundColor: '#1F7EC2'
        }}
      />
    </Box>
  )
}

export default SplashScreen 