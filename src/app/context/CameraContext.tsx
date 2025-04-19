// src/app/context/CameraContext.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// コンテキストの値の型を定義
interface CameraContextValue {
  isCameraOpen: boolean
  setIsCameraOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const CameraContext = createContext<CameraContextValue | undefined>(undefined)

export function CameraProvider({ children }: { children: ReactNode }) {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  return (
    <CameraContext.Provider value={{ isCameraOpen, setIsCameraOpen }}>
      {children}
    </CameraContext.Provider>
  )
}

export function useCamera() {
  const ctx = useContext(CameraContext)
  if (!ctx) throw new Error('useCamera must be used within CameraProvider')
  return ctx
}
