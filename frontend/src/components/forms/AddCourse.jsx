import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material'
import { postData } from '../../api/api'
import AddUnit from './AddUnit'
import AddSection from './AddSection'
import AddResource from './AddResource'
import AddAssessment from './AddAssessment'

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '20px 0' }}>
    {value === index && children}
  </div>
)

const AddCourse = () => {
  const [name, setName] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await postData('courses', { name })
      if (response.status === 201) {
        setName('')
        alert('Course added successfully')
      }
    } catch (error) {
      console.error('Error adding course:', error)
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Paper sx={{ borderRadius: '16px', p: 2 }}>
        <Typography
          variant='h5'
          sx={{ mb: 1, fontWeight: 'bold', fontSize: '24px' }}
        >
          Add Course
        </Typography>
        <Typography
          variant='body1'
          sx={{ mb: 2, fontSize: '18px', color: '#5B5B5B' }}
        >
          Please provide the details of the course to be added.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='Course Name'
            value={name}
            onChange={e => setName(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
          <Button
            variant='contained'
            onClick={handleSubmit}
            sx={{ 
              minWidth: '100px',
              width: '100px',
              borderRadius: '8px',
              height: '36px'
            }}
          >
            Save
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              flexGrow: 1,
              color: '#8F8F8F',
              fontWeight: 'bold',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 'bold'
              }
            }
          }}
        >
          <Tab label="Unit" />
          <Tab label="Section" />
          <Tab label="Learning Material" />
          <Tab label="Assessment" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          <TabPanel value={activeTab} index={0}>
            <AddUnit />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AddSection />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <AddResource />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <AddAssessment />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}

export default AddCourse
