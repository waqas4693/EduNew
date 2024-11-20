import axios from 'axios'
import url from '../components/config/server-url'

const axiosInstance = axios.create({
  baseURL: url
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const postData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.post(endpoint, data)
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const getData = async (endpoint) => {
  try {
    const response = await axiosInstance.get(endpoint)
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const putData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.put(endpoint, data)
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const deleteData = async (endpoint) => {
  try {
    const response = await axiosInstance.delete(endpoint)
    return response
  } catch (error) {
    throw error.response || error
  }
}