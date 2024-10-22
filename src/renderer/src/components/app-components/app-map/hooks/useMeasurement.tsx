import { useEffect, useRef, useState } from 'react'

import * as Cesium from 'cesium'
import * as turf from '@turf/turf'

export const useMeasurement = (viewerRef: React.MutableRefObject<Cesium.Viewer | null>) => {
  const [isDrawingPoint, setIsDrawingPoint] = useState(false)
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const drawnEntitiesRef = useRef<any[]>([])
  const currentMousePositionRef = useRef<Cesium.Cartesian3 | null>(null)

  useEffect(() => {
    if (!viewerRef.current) return

    const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)

    handler.setInputAction((movement: any) => {
      const viewer = viewerRef.current
      if (!viewer) return

      const cartesian = viewer.scene.globe.pick(
        viewer.camera.getPickRay(movement.position)!,
        viewer.scene
      )
      if (!cartesian) return

      if (isDrawingPoint) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)
        const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)
        const pointEntity = viewer.entities.add({
          position: cartesian,
          label: {
            text: `Lon: ${longitude}, Lat: ${latitude}`,
            font: '12pt sans-serif',
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 10)
          }
        })
        drawnEntitiesRef.current.push(pointEntity)
      } else if (isDrawingLine || isDrawingPolygon) {
        const pointEntity = viewer.entities.add({
          position: cartesian,
          point: { pixelSize: 10, color: Cesium.Color.RED }
        })
        drawnEntitiesRef.current.push(pointEntity)

        if (!drawnEntitiesRef.current.some((ent) => ent.polyline)) {
          const polylineEntity = viewer.entities.add({
            polyline: {
              positions: new Cesium.CallbackProperty(
                () =>
                  [
                    ...drawnEntitiesRef.current
                      .filter((ent) => ent.position)
                      .map((ent) => ent.position!.getValue(Cesium.JulianDate.now())),
                    currentMousePositionRef.current
                  ].filter(Boolean),
                false
              ),
              width: 2,
              material: Cesium.Color.BLUE
            }
          })
          drawnEntitiesRef.current.push(polylineEntity)
        }

        updateLineDistanceLabels()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((movement: any) => {
      if ((isDrawingLine || isDrawingPolygon) && drawnEntitiesRef.current.length > 1) {
        const viewer = viewerRef.current
        if (!viewer) return

        const cartesian = viewer.scene.globe.pick(
          viewer.camera.getPickRay(movement.endPosition)!,
          viewer.scene
        )
        if (!cartesian) return

        currentMousePositionRef.current = cartesian
        updateLineDistanceLabels()
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(() => {
      if (isDrawingPolygon && drawnEntitiesRef.current.length >= 3) {
        const viewer = viewerRef.current
        if (!viewer) return

        const polylineEntityIndex = drawnEntitiesRef.current.findIndex((ent) => ent.polyline)
        if (polylineEntityIndex !== -1) {
          viewer.entities.remove(drawnEntitiesRef.current[polylineEntityIndex])
          drawnEntitiesRef.current.splice(polylineEntityIndex, 1)
        }

        const positions = drawnEntitiesRef.current
          .filter((ent) => ent.position)
          .map((ent) => ent.position!.getValue(Cesium.JulianDate.now()))
        positions.push(positions[0])

        const polygonEntity = viewer.entities.add({
          polygon: {
            hierarchy: positions,
            material: Cesium.Color.GREEN.withAlpha(0.5)
          }
        })
        drawnEntitiesRef.current.push(polygonEntity)

        const cartographicPositions = positions.map((pos) => Cesium.Cartographic.fromCartesian(pos))
        const coordinates = cartographicPositions.map((pos) => [
          Cesium.Math.toDegrees(pos.longitude),
          Cesium.Math.toDegrees(pos.latitude)
        ])
        const polygon = turf.polygon([coordinates])
        const area = turf.area(polygon)
        const centroid = turf.centroid(polygon)
        const [centroidLon, centroidLat] = centroid.geometry.coordinates
        const centroidCartesian = Cesium.Cartesian3.fromDegrees(centroidLon, centroidLat)
        const areaLabel = `Area: ${(area / 1000000).toFixed(2)} km²`

        viewer.entities.add({
          position: centroidCartesian,
          label: {
            text: areaLabel,
            font: '12pt sans-serif',
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
          }
        })
      }

      setIsDrawingLine(false)
      setIsDrawingPolygon(false)
      currentMousePositionRef.current = null
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    return (): void => {
      handler.destroy()
    }
  }, [isDrawingPoint, isDrawingLine, isDrawingPolygon])

  const updateLineDistanceLabels = (): void => {
    const viewer = viewerRef.current
    if (!viewer || drawnEntitiesRef.current.length < 2) return

    drawnEntitiesRef.current
      .filter((ent) => ent.position && !ent.polyline)
      .forEach((entity, idx, arr) => {
        if (idx === 0) {
          entity.label = {
            text: `0 km`,
            font: '12pt sans-serif',
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10)
          }
          return
        }
        const prevPos = arr[idx - 1].position!.getValue(Cesium.JulianDate.now())
        const currPos = entity.position!.getValue(Cesium.JulianDate.now())
        const distance = Cesium.Cartesian3.distance(prevPos, currPos)

        entity.label = {
          text: `${(distance / 1000).toFixed(2)} km`,
          font: '12pt sans-serif',
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10)
        }
      })
  }

  const startDrawingPoint = (): void => {
    clearDrawings()
    setIsDrawingPoint(true)
    setIsDrawingLine(false)
    setIsDrawingPolygon(false)
  }

  const startDrawingLine = (): void => {
    clearDrawings()
    setIsDrawingPoint(false)
    setIsDrawingLine(true)
    setIsDrawingPolygon(false)
  }

  const startDrawingPolygon = (): void => {
    clearDrawings()
    setIsDrawingPoint(false)
    setIsDrawingLine(false)
    setIsDrawingPolygon(true)
  }

  const clearDrawings = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return

    drawnEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity))
    drawnEntitiesRef.current = []
    viewer.entities.values.forEach((entity) => {
      if (entity.label?.text?.getValue().startsWith('Area:')) {
        viewer.entities.remove(entity)
      }
    })
    setIsDrawingPoint(false)
    setIsDrawingLine(false)
    setIsDrawingPolygon(false)
  }
  return {
    clearDrawings,
    startDrawingPoint,
    startDrawingLine,
    startDrawingPolygon
  }
}
