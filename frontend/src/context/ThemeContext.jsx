import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [background, setBackground] = useState(null)

  return (
    <ThemeContext.Provider value={{ background, setBackground }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext) 