import { useState } from 'react'
import Grid from '@mui/material/Grid2'
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Link
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const getDaysInMonth = date => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = []

    // Add previous month's days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i)
      daysInMonth.unshift(prevDate)
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i))
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - daysInMonth.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      daysInMonth.push(new Date(year, month + 1, i))
    }

    return daysInMonth
  }

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    )
  }

  const isCurrentMonth = date => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isSelected = date => {
    // Add your selection logic here
    return false
  }

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '12px',
        bgcolor: 'transparent',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ bgcolor: 'white', borderRadius: '12px' }}>
        <Box
          sx={{
            p: '10px',
            color: 'white',
            bgcolor: '#1a1a1a',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}
        >
          <Typography variant='h6' align='center'>
            Calendar
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <IconButton onClick={handlePrevMonth} size='small'>
            <ChevronLeftIcon sx={{ color: '#4169e1' }} />
          </IconButton>
          <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
            {currentDate.toLocaleString('default', {
              month: 'long',
              year: 'numeric'
            })}
          </Typography>
          <IconButton onClick={handleNextMonth} size='small'>
            <ChevronRightIcon sx={{ color: '#4169e1' }} />
          </IconButton>
        </Box>

        <Box sx={{ p: '12px' }}>
          <Grid container>
            {daysOfWeek.map(day => (
              <Grid size={12 / 7} key={day}>
                <Box
                  sx={{
                    p: 1,
                    color: '#666',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '0.75rem'
                  }}
                >
                  {day}
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container>
            {getDaysInMonth(currentDate).map((date, index) => (
              <Grid size={12 / 7} key={index}>
                <Box
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    color: isCurrentMonth(date) ? 'black' : '#ccc',
                    bgcolor: isSelected(date) ? '#4169e1' : 'transparent',
                    '&:hover': {
                      bgcolor: '#e8eaf6',
                      cursor: 'pointer'
                    },
                    borderRadius: 1,
                    m: 0.2
                  }}
                >
                  {date.getDate()}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      <Box sx={{ m: 1 }}>
        <Typography
          sx={{
            my: 1,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          Upcoming Dates
        </Typography>

        <List>
          <ListItem
            sx={{
              pl: '80px',
              bgcolor: 'white',
              borderRadius: '16px',
              boxShadow: '0px 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Box
              sx={{
                mr: 2,
                color: 'white',
                minWidth: '70px',
                bgcolor: '#4169e1',
                textAlign: 'center',
                borderTopLeftRadius: '16px',
                borderBottomLeftRadius: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0
              }}
            >
              <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
                Nov
              </Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 600 }}>
                5<sup style={{ fontSize: '12px' }}>th</sup>
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  overflow: 'hidden',
                  WebkitLineClamp: 2,
                  display: '-webkit-box',
                  textOverflow: 'ellipsis',
                  WebkitBoxOrient: 'vertical'
                }}
              >
                <Box component='span' sx={{ fontWeight: 500 }}>
                  GROUP B Unit:
                </Box>{' '}
                <Box
                  component='span'
                  sx={{
                    color: 'text.secondary'
                  }}
                >
                  Understanding and using inclusive learning and teaching
                  approaches in education and training is due.
                </Box>
              </Typography>
              <Link
                href='#'
                sx={{
                  mt: 1,
                  color: '#4169e1',
                  fontSize: '16px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Go to Course
              </Link>
            </Box>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}

export default Calendar
