export const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map((err) => err.message)
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

  if (error instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid assessment content format'
    })
  }

  if (error.message === 'Failed to upload file to S3') {
    return res.status(502).json({
      success: false,
      message: 'Failed to upload file to storage. Please try again.'
    })
  }

  return res.status(500).json({
    success: false,
    message: error?.message || 'Internal server error'
  })
}
