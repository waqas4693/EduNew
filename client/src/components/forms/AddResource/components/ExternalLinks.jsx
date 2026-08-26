import { Box, TextField, IconButton, Typography } from '@mui/material'
import { useCallback } from 'react'
import PropTypes from 'prop-types'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

const ExternalLinks = ({ links, onChange }) => {
  const handleLinkChange = useCallback((index, field, value) => {
    const newLinks = [...links]
    newLinks[index] = {
      ...newLinks[index],
      [field]: value
    }
    onChange(newLinks)
  }, [links, onChange])

  const addLink = () => {
    if (links.length < 3) {
      onChange([...links, { name: '', url: '' }])
    }
  }

  const removeLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index)
    onChange(newLinks)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {links.map((link, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            size='small'
            label={`Link ${index + 1} Name`}
            value={link.name}
            onChange={e => handleLinkChange(index, 'name', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': {
                  border: '1px solid #20202033'
                }
              },
              '& .MuiInputLabel-root': {
                backgroundColor: 'white',
                padding: '0 4px',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
          />
          <TextField
            fullWidth
            size='small'
            label={`External Link ${index + 1}`}
            value={link.url}
            onChange={e => handleLinkChange(index, 'url', e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': {
                  border: '1px solid #20202033'
                }
              },
              '& .MuiInputLabel-root': {
                backgroundColor: 'white',
                padding: '0 4px',
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }
            }}
          />
          {index > 0 && (
            <IconButton
              onClick={() => removeLink(index)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon />
            </IconButton>
          )}
          {index === 0 && links.length < 3 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={addLink}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

ExternalLinks.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      url: PropTypes.string
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired
}

export default ExternalLinks 