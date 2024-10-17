import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'

/**
 * Custom hook to manage flight data and interactions within the Cesium Viewer.
 *
 * @param viewerRef - Reference to the Cesium Viewer instance.
 * @param flightData - Data containing flight information.
 * @param onFlightsInViewChange - Callback triggered when the flights in view change.
 * @param selectedFlightId - ID of the currently selected flight.
 * @param setSelectedFlightId - Function to update the selected flight ID.
 */
export const useFlightManager = (
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  flightData: any,
  onFlightsInViewChange: (flightsInView: any[]) => void,
  selectedFlightId: string | null,
  setSelectedFlightId: (id: string | null) => void
) => {
  const flightsRef = useRef<{ [key: string]: Cesium.Entity | any }>({})
  const selectedFlightsRef = useRef<{ [key: string]: boolean }>({})
  const selectedEntityPolylineRef = useRef<Cesium.Entity | null>(null)
  const selectedEntityPositionsRef = useRef<Cesium.Cartesian3[]>([])

  // Tile matrices and data references
  const tileMatrixRef = useRef<any[][]>([])
  const tileFlightDataRef = useRef<Map<string, any[]>>(new Map())
  const tileWidth = 5
  const tileHeight = 5

  // Airplane model reference
  const airplaneModelGraphicsRef = useRef<Cesium.ModelGraphics | null>(null)

  /**
   * Initializes the Cesium Viewer, sets up event listeners, and loads initial flight data.
   */
  useEffect(() => {
    if (!viewerRef.current) return

    const onCameraChanged = () => {
      const flightsInView = getFlightsInView()
      onFlightsInViewChange(flightsInView)
    }

    viewerRef.current.camera.changed.addEventListener(onCameraChanged)

    initializeTileMatrix()
    drawTileBoundaries()

    if (flightData) {
      distributeFlightsToTiles(flightData)
      updateFlightsOnCesium(flightData)
    }

    return () => {
      viewerRef.current?.camera.changed.removeEventListener(onCameraChanged)
    }
  }, [viewerRef.current])

  /**
   * Updates flight distribution and Cesium entities when flight data changes.
   */
  useEffect(() => {
    if (!flightData || !viewerRef.current) return

    distributeFlightsToTiles(flightData)
    updateFlightsOnCesium(flightData)
  }, [flightData])

  /**
   * Handles updates when the selected flight changes, including entity appearance and camera zoom.
   */
  useEffect(() => {
    if (!viewerRef.current) return

    if (selectedFlightId) {
      resetSelectedFlights()
      if (selectedEntityPolylineRef.current) {
        viewerRef.current.entities.remove(selectedEntityPolylineRef.current)
        selectedEntityPolylineRef.current = null
        selectedEntityPositionsRef.current = []
      }

      const entity = flightsRef.current[selectedFlightId]
      if (entity) {
        resetSelectedFlights()
        selectedFlightsRef.current[selectedFlightId] = true

        const state = entity.properties?.state?.getValue(Cesium.JulianDate.now())
        const heading = state ? state[10] : undefined

        updateEntityAppearance(entity, true, entity.name.toUpperCase(), heading)

        viewerRef.current.zoomTo(
          entity,
          new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 200000)
        )

        if (!selectedEntityPolylineRef.current) {
          selectedEntityPositionsRef.current = []

          const initialPosition = entity.position?.getValue(Cesium.JulianDate.now())
          if (initialPosition) {
            selectedEntityPositionsRef.current.push(initialPosition)
          }

          selectedEntityPolylineRef.current = viewerRef.current.entities.add({
            polyline: {
              positions: new Cesium.CallbackProperty(
                () => selectedEntityPositionsRef.current,
                false
              ),
              width: 5,
              material: new Cesium.PolylineGlowMaterialProperty({
                color: Cesium.Color.DEEPSKYBLUE,
                glowPower: 0.3,
                taperPower: 1
              }),
              depthFailMaterial: new Cesium.PolylineGlowMaterialProperty({
                color: Cesium.Color.DEEPSKYBLUE,
                glowPower: 0.3
              })
            }
          })
        }
      }
    } else {
      resetSelectedFlights()
      if (selectedEntityPolylineRef.current) {
        viewerRef.current.entities.remove(selectedEntityPolylineRef.current)
        selectedEntityPolylineRef.current = null
        selectedEntityPositionsRef.current = []
      }
    }
  }, [selectedFlightId])

  /**
   * Handles mouse click events to select or deselect flights based on user interaction.
   */
  useEffect(() => {
    if (!viewerRef.current) return

    const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)

    handler.setInputAction((movement: any) => {
      const pickedObject = viewerRef.current!.scene.pick(movement.position)
      if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id
        const id = entity.id
        if (flightsRef.current[id]) {
          setSelectedFlightId(id)
        }
      } else {
        setSelectedFlightId(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
    }
  }, [setSelectedFlightId, viewerRef.current])

  /**
   * Draws the boundaries of each tile on the Cesium Viewer.
   */
  function drawTileBoundaries() {
    const viewer = viewerRef.current
    if (!viewer) return

    const tileMatrix = tileMatrixRef.current
    tileMatrix.forEach((row) => {
      row.forEach((tile) => {
        const { west, east, south, north } = tile.boundingBox
        const positions = Cesium.Cartesian3.fromDegreesArray([
          west,
          south,
          east,
          south,
          east,
          north,
          west,
          north,
          west,
          south
        ])

        viewer.entities.add({
          polyline: {
            positions: positions,
            width: 0.5,
            material: Cesium.Color.GRAY.withAlpha(0.2)
          }
        })
      })
    })
  }

  /**
   * Initializes the tile matrix covering the entire world based on predefined tile dimensions.
   */
  const initializeTileMatrix = () => {
    const tileMatrix = [] as any

    for (let y = -90; y < 90; y += tileHeight) {
      const row = [] as any
      for (let x = -180; x < 180; x += tileWidth) {
        const west = x
        const east = x + tileWidth
        const south = y
        const north = y + tileHeight

        const tileName = `Tile_${x}_${y}`
        const boundingBox = { west, east, south, north }
        row.push({ tileName, boundingBox })
        tileFlightDataRef.current.set(tileName, [])
      }
      tileMatrix.push(row)
    }

    tileMatrixRef.current = tileMatrix
  }

  /**
   * Distributes flights into their respective tiles based on their geographical positions.
   *
   * @param flightData - Data containing flight information.
   */
  const distributeFlightsToTiles = (flightData: any) => {
    // Clear existing flight lists
    tileFlightDataRef.current.forEach((_, key) => {
      tileFlightDataRef.current.set(key, [])
    })

    // Assign flights to tiles based on their longitude and latitude
    flightData.states.forEach((state: any) => {
      const longitude = state[5]
      const latitude = state[6]

      if (longitude !== null && latitude !== null) {
        const tileX = Math.floor((longitude + 180) / tileWidth) * tileWidth - 180
        const tileY = Math.floor((latitude + 90) / tileHeight) * tileHeight - 90
        const tileName = `Tile_${tileX}_${tileY}`

        if (tileFlightDataRef.current.has(tileName)) {
          tileFlightDataRef.current.get(tileName)!.push(state)
        }
      }
    })
  }

  /**
   * Updates the flight entities within the Cesium Viewer based on the current flight data.
   *
   * @param flightData - Data containing flight information.
   */
  const updateFlightsOnCesium = (flightData: any) => {
    const viewer = viewerRef.current
    if (!viewer) return

    const flights = flightsRef.current
    const selectedFlights = selectedFlightsRef.current

    const newFlightIds = new Set<string>()
    tileFlightDataRef.current.forEach((flightStates) => {
      flightStates.forEach((state: any) => {
        const icao24 = state[0]
        newFlightIds.add(icao24)

        const callsign = (state[1] || '').trim()
        const longitude = state[5]
        const latitude = state[6]
        const altitude = state[7]
        const heading = state[10]

        if (latitude !== null && longitude !== null) {
          let flightEntity = flights[icao24]

          const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude)

          if (flightEntity) {
            const positionProperty = flightEntity.position as Cesium.ConstantPositionProperty
            positionProperty.setValue(position)

            if (heading !== null && heading !== undefined) {
              const hpr = new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(heading - 90), // Adjust based on model orientation
                0,
                0
              )
              flightEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
            }

            if (flightEntity.billboard) {
              flightEntity.billboard.rotation =
                heading !== null && heading !== undefined ? Cesium.Math.toRadians(-1 * heading) : 0
            }

            flightEntity.properties.state = new Cesium.ConstantProperty(state)

            if (selectedFlightId === icao24 && selectedEntityPolylineRef.current) {
              selectedEntityPositionsRef.current.push(position)
            }
          } else {
            flightEntity = viewer.entities.add({
              id: icao24,
              name: callsign || 'Unknown Flight',
              position: position,
              orientation:
                heading !== null && heading !== undefined
                  ? Cesium.Transforms.headingPitchRollQuaternion(
                      position,
                      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0)
                    )
                  : undefined,
              billboard: {
                image: 'src/assets/flight.png',
                rotation:
                  heading !== null && heading !== undefined
                    ? Cesium.Math.toRadians(-1 * heading)
                    : 0,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                alignedAxis: Cesium.Cartesian3.UNIT_Z
              },
              properties: {
                state: new Cesium.ConstantProperty(state)
              }
            })
          }

          flights[icao24] = flightEntity

          const isSelected = selectedFlights[icao24] || false
          updateEntityAppearance(flightEntity, isSelected, callsign, heading)
        }
      })
    })

    for (const id in flights) {
      if (!newFlightIds.has(id)) {
        viewer.entities.remove(flights[id])
        delete flights[id]
      }
    }
  }

  /**
   * Retrieves the list of flights currently within the camera's view.
   *
   * @returns An array of flight states that are visible in the current view.
   */
  const getFlightsInView = (): any[] => {
    const viewer = viewerRef.current
    if (!viewer || !viewer.scene) return []

    let rectangle: Cesium.Rectangle | undefined

    try {
      rectangle = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid)
    } catch (e) {
      rectangle = undefined
    }

    const visibleFlights: any[] = []

    if (rectangle) {
      const west = Cesium.Math.toDegrees(rectangle.west)
      const south = Cesium.Math.toDegrees(rectangle.south)
      const east = Cesium.Math.toDegrees(rectangle.east)
      const north = Cesium.Math.toDegrees(rectangle.north)

      const minTileX = Math.floor((west + 180) / tileWidth) * tileWidth - 180
      const maxTileX = Math.floor((east + 180) / tileWidth) * tileWidth - 180
      const minTileY = Math.floor((south + 90) / tileHeight) * tileHeight - 90
      const maxTileY = Math.floor((north + 90) / tileHeight) * tileHeight - 90

      for (let tileY = minTileY; tileY <= maxTileY; tileY += tileHeight) {
        for (let tileX = minTileX; tileX <= maxTileX; tileX += tileWidth) {
          const tileName = `Tile_${tileX}_${tileY}`
          const flightsInTile = tileFlightDataRef.current.get(tileName)
          if (flightsInTile) {
            flightsInTile.forEach((state) => {
              const longitude = state[5]
              const latitude = state[6]
              if (
                longitude >= west &&
                longitude <= east &&
                latitude >= south &&
                latitude <= north
              ) {
                visibleFlights.push(state)
              }
            })
          }
        }
      }
    } else {
      const camera = viewer.camera
      const frustum = camera.frustum
      const cullingVolume = frustum.computeCullingVolume(
        camera.position,
        camera.direction,
        camera.up
      )

      const flights = flightsRef.current
      const currentTime = viewer.clock.currentTime

      for (const flightId in flights) {
        const flightEntity = flights[flightId]
        const position = flightEntity.position.getValue(currentTime)

        if (position) {
          const boundingSphere = new Cesium.BoundingSphere(position, 0)

          const visibility = cullingVolume.computeVisibility(boundingSphere)
          if (visibility !== Cesium.Intersect.OUTSIDE) {
            const state = flightEntity.properties?.state?.getValue(currentTime)
            if (state) {
              visibleFlights.push(state)
            }
          }
        }
      }
    }

    return visibleFlights
  }

  /**
   * Retrieves or initializes the airplane model graphics for selected flights.
   *
   * @returns The Cesium ModelGraphics instance for the airplane.
   */
  const getAirplaneModel = (): Cesium.ModelGraphics => {
    if (!airplaneModelGraphicsRef.current) {
      airplaneModelGraphicsRef.current = new Cesium.ModelGraphics({
        uri: 'src/assets/plane.glb',
        minimumPixelSize: 64,
        maximumScale: 20000
      })
    }
    return airplaneModelGraphicsRef.current
  }

  /**
   * Updates the appearance of a flight entity based on its selection state.
   *
   * @param entity - The Cesium Entity representing the flight.
   * @param isSelected - Whether the flight is currently selected.
   * @param callsign - The callsign of the flight.
   * @param heading - The heading of the flight.
   */
  const updateEntityAppearance = (
    entity: Cesium.Entity,
    isSelected: boolean,
    callsign: string | null,
    heading: number | undefined
  ) => {
    if (isSelected) {
      entity.billboard = undefined
      entity.label = {
        text: callsign || '',
        font: '12pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -9)
      } as any
      entity.model = getAirplaneModel()
    } else {
      entity.label = undefined
      entity.model = undefined
      entity.billboard = {
        pixelSize: 5,
        image: 'src/assets/flight.png',
        rotation: heading !== undefined ? Cesium.Math.toRadians(-1 * heading) : 0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        alignedAxis: Cesium.Cartesian3.UNIT_Z
      } as any
    }
  }

  /**
   * Resets all selected flights to their default appearance and state.
   */
  const resetSelectedFlights = () => {
    const selectedFlights = selectedFlightsRef.current
    for (const id in selectedFlights) {
      if (selectedFlights[id]) {
        selectedFlights[id] = false
        const entity = flightsRef.current[id]
        if (entity) {
          const state = entity.properties?.state?.getValue(Cesium.JulianDate.now())
          const heading = state ? state[10] : undefined

          updateEntityAppearance(entity, false, null, heading)
        }
      }
    }
  }
}
