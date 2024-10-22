import { useState, useEffect, ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plane, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { Input } from '@/components/ui/input'

interface AppSidebarProps {
  allFlightData: any[]
  flightsInView: any[]
  selectedFlightId: string | null
  setSelectedFlightId: (id: string | null) => void
}

export function AppSidebar({
  allFlightData,
  flightsInView,
  selectedFlightId,
  setSelectedFlightId
}: Readonly<AppSidebarProps>): ReactNode {
  const [visibleFlights, setVisibleFlights] = useState<any[]>([])
  const [itemsToShow, setItemsToShow] = useState<number>(10)
  const [filterTerm, setFilterTerm] = useState('')

  const categoryDescriptions = [
    'No information',
    'No ADS-B Emitter Category Information',
    'Light (< 15500 lbs)',
    'Small (15500 to 75000 lbs)',
    'Large (75000 to 300000 lbs)',
    'High Vortex Large',
    'Heavy (> 300000 lbs)',
    'High Performance',
    'Rotorcraft',
    'Glider / sailplane',
    'Lighter-than-air',
    'Parachutist / Skydiver',
    'Ultralight / hang-glider / paraglider',
    'Reserved',
    'Unmanned Aerial Vehicle',
    'Space / Trans-atmospheric vehicle',
    'Surface Vehicle – Emergency Vehicle',
    'Surface Vehicle – Service Vehicle',
    'Point Obstacle',
    'Cluster Obstacle',
    'Line Obstacle'
  ]

  const positionSources = ['ADS-B', 'ASTERIX', 'MLAT', 'FLARM']

  useEffect(() => {
    let flightsToDisplay: any = []

    if (filterTerm) {
      flightsToDisplay = allFlightData.filter((flight: any) =>
        (flight[1] || '').toLowerCase().includes(filterTerm.toLowerCase())
      )
    } else {
      flightsToDisplay = flightsInView
    }

    if (selectedFlightId) {
      const selectedFlightIndex = flightsToDisplay.findIndex(
        (flight: any) => flight[0] === selectedFlightId
      )
      if (selectedFlightIndex > -1) {
        const [selectedFlight] = flightsToDisplay.splice(selectedFlightIndex, 1)
        flightsToDisplay.unshift(selectedFlight)
      }
    }

    setVisibleFlights(flightsToDisplay.slice(0, itemsToShow))
  }, [allFlightData, flightsInView, itemsToShow, filterTerm, selectedFlightId])

  useEffect(() => {
    if (selectedFlightId) {
      const updatedFlight = allFlightData.find((flight: any) => flight[0] === selectedFlightId)
      if (updatedFlight) {
        setVisibleFlights((prevFlights) => {
          const updatedFlights = prevFlights.map((flight) =>
            flight[0] === selectedFlightId ? updatedFlight : flight
          )
          return updatedFlights
        })
      }
    }
  }, [allFlightData, selectedFlightId])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <Input
          type="text"
          placeholder="Filter by flight code"
          value={filterTerm}
          onChange={(e) => {
            setFilterTerm(e.target.value)
            setItemsToShow(10)
          }}
          className="w-full"
        />
      </div>
      <ScrollArea className="flex-grow">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {visibleFlights.map((flight: any, index: number) => {
            const isSelected = selectedFlightId === flight[0]

            return (
              <Card
                key={index}
                className="hover:bg-accent transition-colors p-2"
                onClick={() => setSelectedFlightId(isSelected ? null : flight[0])}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold">{flight[1] || 'N/A'}</span>
                    <Badge
                      variant="outline"
                      className={flight[8] ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}
                    >
                      {flight[8] ? 'On Ground' : 'In Air'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{flight[2]}</span>
                    <Plane className="w-4 h-4" />
                    <span>ICAO: {flight[0].toUpperCase()}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>Latitude: {flight[6] !== null ? flight[6].toFixed(4) : 'N/A'}</div>
                    <div>Longitude: {flight[5] !== null ? flight[5].toFixed(4) : 'N/A'}</div>
                    <div>Altitude: {flight[7] !== null ? `${flight[7]}m` : 'N/A'}</div>
                    <div>Velocity: {flight[9] !== null ? `${flight[9]}m/s` : 'N/A'}</div>
                    <div>Heading: {flight[10] !== null ? `${flight[10]}°` : 'N/A'}</div>
                    <div>Vertical Rate: {flight[11] !== null ? `${flight[11]}m/s` : 'N/A'}</div>
                    <div>Last Contact: {formatTimestamp(flight[4])}</div>
                    <div>Squawk: {flight[14] || 'N/A'}</div>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Category: {categoryDescriptions[flight[17]]}</p>
                          <p>Position Source: {positionSources[flight[16]]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span>Updated: {formatTimestamp(flight[3])}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString()
}
