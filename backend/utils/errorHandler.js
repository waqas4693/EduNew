export const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => err.message)
    })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error'
    })
  }

  // console.error('Error Testing:', error)
  
  // return res.status(500).json({
  //   success: false,
  //   message: 'Internal server error'
  // })
} 