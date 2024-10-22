import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'

export const useCameraHistory = (
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>
): {
  undoCameraView: () => void
  redoCameraView: () => void
} => {
  const undoStack = useRef<any[]>([])
  const redoStack = useRef<any[]>([])

  const maxStackSize = 20
  const isUndoRedoAction = useRef<boolean>(false)

  useEffect(() => {
    if (!viewerRef.current) return
    const onCameraChanged = (): void => {
      console.log('Camera changed. isUndoRedoAction:', isUndoRedoAction.current)
      if (!isUndoRedoAction.current) {
        const camera = viewerRef.current!.camera
        const cameraState = {
          destination: camera.position.clone(),
          orientation: {
            heading: camera.heading,
            pitch: camera.pitch,
            roll: camera.roll
          }
        }

        undoStack.current.push(cameraState)
        if (undoStack.current.length > maxStackSize) {
          undoStack.current.shift()
        }
        redoStack.current = []
      }
    }

    viewerRef.current.camera.changed.addEventListener(onCameraChanged)
    const onMoveStart = (): void => {
      if (isUndoRedoAction.current) {
        console.log('Camera move started due to undo/redo.')
      }
    }

    const onMoveEnd = (): void => {
      if (isUndoRedoAction.current) {
        console.log('Camera move ended for undo/redo.')
        isUndoRedoAction.current = false
      }
    }

    viewerRef.current.camera.moveStart.addEventListener(onMoveStart)
    viewerRef.current.camera.moveEnd.addEventListener(onMoveEnd)
    onCameraChanged()
    const handleKeyDown = (event: KeyboardEvent): void => {
      console.log(
        `Key pressed: ${event.code}, ctrlKey: ${event.ctrlKey}, shiftKey: ${event.shiftKey}`
      )
      if (event.ctrlKey && event.code === 'KeyZ' && !event.shiftKey) {
        event.preventDefault()
        undoCameraView()
      } else if (
        (event.ctrlKey && event.code === 'KeyY') ||
        (event.ctrlKey && event.shiftKey && event.code === 'KeyZ')
      ) {
        event.preventDefault()
        redoCameraView()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      viewerRef.current?.camera.changed.removeEventListener(onCameraChanged)
      viewerRef.current?.camera.moveStart.removeEventListener(onMoveStart)
      viewerRef.current?.camera.moveEnd.removeEventListener(onMoveEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewerRef.current])

  const undoCameraView = (): void => {
    if (undoStack.current.length > 1) {
      const currentView = undoStack.current.pop()!
      redoStack.current.push(currentView)
      if (redoStack.current.length > maxStackSize) {
        redoStack.current.shift()
      }
      const previousView = undoStack.current[undoStack.current.length - 1]
      isUndoRedoAction.current = true
      viewerRef.current!.camera.flyTo({
        ...previousView,
        duration: 0.5
      })
    }
  }

  const redoCameraView = (): void => {
    if (redoStack.current.length > 0) {
      const nextView = redoStack.current.pop()!
      undoStack.current.push(nextView)
      if (undoStack.current.length > maxStackSize) {
        undoStack.current.shift()
      }
      isUndoRedoAction.current = true
      viewerRef.current!.camera.flyTo({
        ...nextView,
        duration: 0.5
      })
    }
  }

  return {
    undoCameraView,
    redoCameraView
  }
}
