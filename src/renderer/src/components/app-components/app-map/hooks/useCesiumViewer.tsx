import { MutableRefObject, useEffect, useRef } from 'react'
import * as Cesium from 'cesium'

export const useCesiumViewer = (
  cesiumContainerRef: React.RefObject<HTMLDivElement>
): MutableRefObject<Cesium.Viewer | null> => {
  const viewerRef = useRef<Cesium.Viewer | null>(null)

  useEffect(() => {
    if (!cesiumContainerRef.current) return

    const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
      shouldAnimate: true,
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      infoBox: false,
      fullscreenButton: false
    })

    viewerRef.current = viewer

    return () => {
      viewer.destroy()
    }
  }, [cesiumContainerRef])

  return viewerRef
}
