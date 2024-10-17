import React, { createContext, useContext, useState } from 'react'

interface CameraHistoryContextType {
  isUndo: number
  isRedo: number
  undoCameraView: () => void
  redoCameraView: () => void
}

const CameraHistoryContext = createContext<CameraHistoryContextType | undefined>(undefined)

interface CameraHistoryProviderProps {
  children: React.ReactNode
}

export const CameraHistoryProvider: React.FC<CameraHistoryProviderProps> = ({ children }) => {
  const [isUndo, setIsUndo] = useState<number>(0)
  const [isRedo, setIsRedo] = useState<number>(0)

  function undoCameraView() {
    setIsUndo(isUndo + 1)
  }

  function redoCameraView() {
    setIsRedo(isRedo + 1)
  }
  return (
    <CameraHistoryContext.Provider value={{ isRedo, isUndo, undoCameraView, redoCameraView }}>
      {children}
    </CameraHistoryContext.Provider>
  )
}

export const useCameraHistoryContext = (): CameraHistoryContextType => {
  const context = useContext(CameraHistoryContext)
  if (!context) {
    throw new Error('useCameraHistoryContext must be used within a CameraHistoryProvider')
  }
  return context
}
