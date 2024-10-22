import React, { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Rotate3D,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import './CameraControls.css'

interface CameraControlsProps {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>
}

const CameraControls: React.FC<CameraControlsProps> = ({ viewerRef }) => {
  const moveIntervalRef = useRef<{ [key: string]: number }>({})

  const startPan = (direction: 'north' | 'south' | 'east' | 'west'): void => {
    const viewer = viewerRef.current
    if (!viewer) return

    if (moveIntervalRef.current[direction]) return

    const camera = viewer.camera

    const move = (): void => {
      const cameraHeight = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        camera.position
      ).height
      const moveRate = cameraHeight / 100.0

      switch (direction) {
        case 'north':
          camera.moveUp(moveRate)
          break
        case 'south':
          camera.moveDown(moveRate)
          break
        case 'east':
          camera.moveRight(moveRate)
          break
        case 'west':
          camera.moveLeft(moveRate)
          break
        default:
          break
      }
    }

    moveIntervalRef.current[direction] = window.setInterval(move, 10)
  }

  const stopPan = (direction: 'north' | 'south' | 'east' | 'west'): void => {
    if (moveIntervalRef.current[direction]) {
      window.clearInterval(moveIntervalRef.current[direction])
      delete moveIntervalRef.current[direction]
    }
  }

  const startZoom = (isZoomIn: boolean): void => {
    const zoomDirection = isZoomIn ? 'in' : 'out'
    if (moveIntervalRef.current[zoomDirection]) return

    const viewer = viewerRef.current
    if (!viewer) return

    const camera = viewer.camera

    const move = (): void => {
      const cameraHeight = viewer.scene.globe.ellipsoid.cartesianToCartographic(
        camera.position
      ).height
      const moveRate = cameraHeight / 100.0

      if (isZoomIn) {
        camera.moveForward(moveRate)
      } else {
        camera.moveBackward(moveRate)
      }
    }

    moveIntervalRef.current[zoomDirection] = window.setInterval(move, 10)
  }

  const stopZoom = (isZoomIn: boolean): void => {
    const zoomDirection = isZoomIn ? 'in' : 'out'
    if (moveIntervalRef.current[zoomDirection]) {
      window.clearInterval(moveIntervalRef.current[zoomDirection])
      delete moveIntervalRef.current[zoomDirection]
    }
  }

  const handleOrbit = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return

    if (moveIntervalRef.current['orbit']) return

    const camera = viewer.camera

    const heading = Cesium.Math.toRadians(1)

    const orbit = (): void => {
      camera.rotateRight(heading)
    }

    moveIntervalRef.current['orbit'] = window.setInterval(orbit, 10)
  }

  const stopOrbit = (): void => {
    if (moveIntervalRef.current['orbit']) {
      window.clearInterval(moveIntervalRef.current['orbit'])
      delete moveIntervalRef.current['orbit']
    }
  }

  useEffect(() => {
    return () => {
      Object.values(moveIntervalRef.current).forEach((intervalId) => {
        window.clearInterval(intervalId)
      })
    }
  }, [])

  return (
    <div className="absolute top-10 right-5 z-50 flex items-center gap-2 opacity-25 hover:opacity-100 scale-75">
      <div className="flex flex-col gap-2 w-10 h-40 p-2 rounded-md justify-around items-center  shadow-lg bg-opacity-70 ">
        <Button
          size="icon"
          className="rounded-full border-2 border-secondary"
          onMouseDown={() => startZoom(true)}
          onMouseUp={() => stopZoom(true)}
          onMouseLeave={() => stopZoom(true)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="rounded-full border-2 border-secondary p-2"
          onMouseDown={() => startZoom(false)}
          onMouseUp={() => stopZoom(false)}
          onMouseLeave={() => stopZoom(false)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative w-36 h-36 flex justify-center items-center rounded-full border-2 border-primary shadow-lg bg-opacity-70 bg-primary">
        <Button
          size="icon"
          className="top-2 absolute rounded-full border-2 border-secondary"
          onMouseDown={() => startPan('north')}
          onMouseUp={() => stopPan('north')}
          onMouseLeave={() => stopPan('north')}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="bottom-2 absolute rounded-full border-2 border-secondary"
          onMouseDown={() => startPan('south')}
          onMouseUp={() => stopPan('south')}
          onMouseLeave={() => stopPan('south')}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="right-2 absolute rounded-full border-2 border-secondary"
          onMouseDown={() => startPan('east')}
          onMouseUp={() => stopPan('east')}
          onMouseLeave={() => stopPan('east')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="left-2 absolute rounded-full border-2 border-secondary"
          onMouseDown={() => startPan('west')}
          onMouseUp={() => stopPan('west')}
          onMouseLeave={() => stopPan('west')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="absolute rounded-full border-2 border-secondary"
          onMouseDown={handleOrbit}
          onMouseUp={stopOrbit}
          onMouseLeave={stopOrbit}
        >
          <Rotate3D className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default CameraControls
