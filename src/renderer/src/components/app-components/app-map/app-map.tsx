import { useRef, useEffect, useContext } from 'react'
import * as Cesium from 'cesium'
import CameraControls from './tools/CameraControls'
import { Button } from '@/components/ui/button'
import { Dot, Spline, Trash2, TriangleRight } from 'lucide-react'
import UserContext from '@/context/UserContext'
import { useFlightManager } from './hooks/useFlightManager'
import { useMeasurement } from './hooks/useMeasurement'
import { useCameraHistory } from './hooks/useCameraHistory'
import { useCesiumViewer } from './hooks/useCesiumViewer'
import { useCameraHistoryContext } from '@/context/CameraHistoryContext'

interface AppMapProps {
  flightData: any
  onFlightsInViewChange: (flightsInView: any[]) => void
  selectedFlightId: string | null
  setSelectedFlightId: (id: string | null) => void
}

export default function AppMap({
  flightData,
  onFlightsInViewChange,
  selectedFlightId,
  setSelectedFlightId
}: AppMapProps) {
  const cesiumContainer = useRef<HTMLDivElement | null>(null)
  const viewerRef = useCesiumViewer(cesiumContainer!)
  useFlightManager(
    viewerRef,
    flightData,
    onFlightsInViewChange,
    selectedFlightId,
    setSelectedFlightId
  )
  const { isRedo, isUndo } = useCameraHistoryContext()

  useEffect(() => {
    redoCameraView()
  }, [isRedo])
  useEffect(() => {
    undoCameraView()
  }, [isUndo])

  const { startDrawingLine, startDrawingPoint, startDrawingPolygon, clearDrawings } =
    useMeasurement(viewerRef)
  const { undoCameraView, redoCameraView } = useCameraHistory(viewerRef)

  const { kmlFiles } = useContext(UserContext)

  useEffect(() => {
    if (!viewerRef.current || !kmlFiles.length) return

    kmlFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === 'string') {
          const blob = new Blob([text], { type: 'application/vnd.google-earth.kml+xml' })
          const url = URL.createObjectURL(blob)
          Cesium.KmlDataSource.load(url, {
            camera: viewerRef.current!.camera,
            canvas: viewerRef.current!.canvas
          })
            .then((dataSource) => {
              viewerRef.current?.dataSources.add(dataSource)
              viewerRef.current?.zoomTo(dataSource)
            })
            .catch((error) => {
              console.error('Error loading KML:', error)
            })
        }
      }
      reader.readAsText(file)
    })
    return () => {
      kmlFiles.forEach((file) => {
        URL.revokeObjectURL(file.name)
      })
    }
  }, [kmlFiles, viewerRef])

  return (
    <div className="relative h-full w-full">
      <div ref={cesiumContainer} id="cesiumContainer" className="h-full w-full" />

      <CameraControls viewerRef={viewerRef} />
      <div className="absolute top-10 left-5 z-50 flex items-center gap-0 opacity-50 hover:opacity-100 scale-75">
        <Button onClick={startDrawingPoint} className="rounded-none">
          <Dot className="w-4 h-4" />
        </Button>
        <Button onClick={startDrawingLine} className="rounded-none">
          <Spline className="w-4 h-4" />
        </Button>
        <Button onClick={startDrawingPolygon} className="rounded-none">
          <TriangleRight className="w-4 h-4" />
        </Button>
        <Button onClick={clearDrawings} className="rounded-none">
          <Trash2 className="w-4-h-4" />
        </Button>
      </div>
    </div>
  )
}
