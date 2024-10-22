import { useState, useEffect } from 'react'
import InitialPopup from './components/app-components/app-initial-popup/InitialPopup'
import { UserProvider } from './context/UserContext'
import { CameraHistoryProvider } from './context/CameraHistoryContext'
import AppMenu from './components/app-components/app-menu/app-menu'
import { AppSidebar } from './components/app-components/app-sidebar/app-sidebar'
import AppMap from './components/app-components/app-map/app-map'

function App(): JSX.Element {
  const [flightData, setFlightData] = useState<any>(null)
  const [flightsInView, setFlightsInView] = useState<any[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)

  useEffect(() => {
    window.flightAPI.onFlightData((data: any) => {
      setFlightData(data)
    })
  }, [])

  const initialPopupOnClose = (): void => {
    console.log('Popup Closed!')
  }

  return (
    <UserProvider>
      <CameraHistoryProvider>
        <div className="w-full h-screen flex flex-col overflow-hidden">
          <InitialPopup onClose={initialPopupOnClose} />
          <AppMenu />
          <div className="flex flex-grow overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 h-full p-4 overflow-hidden">
              <AppSidebar
                allFlightData={flightData ? flightData.states : []}
                flightsInView={flightsInView}
                selectedFlightId={selectedFlightId}
                setSelectedFlightId={setSelectedFlightId}
              />
            </div>

            <div className="w-full md:w-2/3 h-full relative">
              <AppMap
                flightData={flightData}
                onFlightsInViewChange={setFlightsInView}
                selectedFlightId={selectedFlightId}
                setSelectedFlightId={setSelectedFlightId}
              />
            </div>
          </div>
        </div>
      </CameraHistoryProvider>
    </UserProvider>
  )
}

export default App
