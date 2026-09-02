import axios from 'axios'

const normalizeApiUrl = (url) => {
  if (!url) return 'http://localhost:5000/api/'
  return url.endsWith('/') ? url : `${url}/`
}

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL)
export const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000

const noCacheHeaders = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache'
}

let unauthorizedHandler = null

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler
}

const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('token')

  return {
    ...noCacheHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extraHeaders
  }
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler(error.response?.data?.message)
    }
    return Promise.reject(error)
  }
)

export const postData = async (endpoint, data, config = {}) => {
  try {
    const response = await axios.post(`${API_URL}${endpoint}`, data, {
      timeout: UPLOAD_TIMEOUT_MS,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...config.headers
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const postFormData = async (endpoint, data, config = {}) => {
  try {
    const response = await axios.post(`${API_URL}${endpoint}`, data, {
      timeout: UPLOAD_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
        ...config.headers
      },
      onUploadProgress: config.onUploadProgress
    })
    return response
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw {
        data: {
          message: 'Upload timed out. Try a smaller file or check your connection.'
        }
      }
    }

    throw error.response || error
  }
}

export const putFormData = async (endpoint, data, config = {}) => {
  try {
    const response = await axios.put(`${API_URL}${endpoint}`, data, {
      timeout: UPLOAD_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
        ...config.headers
      },
      onUploadProgress: config.onUploadProgress
    })
    return response
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw {
        data: {
          message: 'Upload timed out. Try a smaller file or check your connection.'
        }
      }
    }

    throw error.response || error
  }
}

export const getData = async (endpoint) => {
  try {
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      params: {
        _t: Date.now()
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const putData = async (endpoint, data, config = {}) => {
  try {
    const response = await axios.put(`${API_URL}${endpoint}`, data, {
      timeout: UPLOAD_TIMEOUT_MS,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...config.headers
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const patchData = async (endpoint, data) => {
  try {
    const response = await axios.patch(`${API_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}

export const deleteData = async (endpoint) => {
  try {
    const response = await axios.delete(`${API_URL}${endpoint}`, {
      headers: getAuthHeaders()
    })
    return response
  } catch (error) {
    throw error.response || error
  }
}
