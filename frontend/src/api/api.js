import axios from 'axios'

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/'
const API_URL = 'https://edusupplements.co.uk/api/'

export const postData = async (endpoint, data, config = {}) => {
  try {
    const token = localStorage.getItem('token')
    console.log('Token for postData:', token)
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
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
    console.log('Token from get api:', token)

    console.log('Get EndPoint:', `${API_URL}${endpoint}`)

    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('Response:', response)
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const putData = async (endpoint, data) => {
  try {
    const token = localStorage.getItem('token')
    console.log('Token:', token)
    const response = await axios.put(`${API_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
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
    console.log('Token:', token)
    const response = await axios.patch(`${API_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
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
    console.log('Token:', token)
    const response = await axios.delete(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}