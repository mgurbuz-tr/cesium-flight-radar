import React, { createContext, useState, ReactNode, useEffect } from 'react'

interface User {
  username: string
  password: string
}

interface UserContextType {
  user: User | null
  isEmulate: boolean
  setUser: (user: User | null) => void
  setEmulate: (value: boolean) => void
  setApiMode: (username: string, password: string) => void
  addKmlFile: (file: File) => void
  kmlFiles: File[]
}

const defaultUserContext: UserContextType = {
  user: null,
  isEmulate: false,
  setUser: () => {},
  setEmulate: () => {},
  setApiMode: (username: string, password: string) => {},
  addKmlFile: () => {},
  kmlFiles: []
}

const UserContext = createContext<UserContextType>(defaultUserContext)

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isEmulate, setEmulateState] = useState<boolean>(false)
  const [kmlFiles, setKmlFiles] = useState<File[]>([])

  const setEmulate = (value: boolean) => {
    setEmulateState(value)
    if (value) {
      window.flightAPI.setEmulateMode()
    }
  }

  const setApiMode = (username: string, password: string) => {
    setEmulateState(false)
    window.flightAPI.setApiMode(username, password)
  }

  const addKmlFile = (file: File) => {
    setKmlFiles((prevFiles) => [...prevFiles, file])
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isEmulate,
        setEmulate,
        setApiMode,
        addKmlFile,
        kmlFiles
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserContext
