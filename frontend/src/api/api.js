import axios from 'axios'

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/'
const API_URL = 'https://13.40.209.120/api/'

const noCacheHeaders = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache'
}

export const postData = async (endpoint, data, config = {}) => {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json',
      ...noCacheHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...config.headers
    }

    const response = await axios.post(`${API_URL}${endpoint}`, data, {
      ...config,
      headers
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const getData = async (endpoint) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: {
        ...noCacheHeaders,
        Authorization: `Bearer ${token}`
      },
      // Bust intermediary/browser GET caches
      params: {
        _t: Date.now()
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const putData = async (endpoint, data) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...noCacheHeaders,
        Authorization: `Bearer ${token}`
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const patchData = async (endpoint, data) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.patch(`${API_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...noCacheHeaders,
        Authorization: `Bearer ${token}`
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const deleteData = async (endpoint) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_URL}${endpoint}`, {
      headers: {
        ...noCacheHeaders,
        Authorization: `Bearer ${token}`
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}
