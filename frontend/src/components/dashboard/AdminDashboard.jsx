import { useState, useEffect } from 'react'
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import { getData } from '../../api/api'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    recentActivities: [],
    activeStudents: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
 
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>
    </Box>
  )
}

export default AdminDashboard 