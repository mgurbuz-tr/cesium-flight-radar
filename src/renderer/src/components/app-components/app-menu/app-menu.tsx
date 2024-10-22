import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger
} from '@/components/ui/menubar'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import './app-menu.css'
import FileUploadDialog from '../app-fileupload/FileUploadDialog'
import { ReactNode, useState } from 'react'
import { useCameraHistoryContext } from '@/context/CameraHistoryContext'

export default function AppMenu(): ReactNode {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleImportKmlClick = (): void => {
    setIsDialogOpen(true)
  }

  const handleDialogClose = (): void => {
    setIsDialogOpen(false)
  }
  const { undoCameraView, redoCameraView } = useCameraHistoryContext()
  const quitApp = (): void => window.electron.ipcRenderer.send('exit')

  return (
    <header className="flex w-full justify-between items-center bg-background border-b border-border px-4 py-2 menubar-drag">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-bold">CesiumFlightRadar</h1>
      </div>
      <Menubar className="border-none bg-transparent menubar">
        <MenubarMenu>
          <MenubarTrigger className="font-medium">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={handleImportKmlClick}>Import KML File</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="font-medium menubar">View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={undoCameraView}>
              Undo View
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={redoCameraView}>
              Redo View
              <MenubarShortcut>⌘Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <Button variant="ghost" size="icon" className="text-foreground menubar" onClick={quitApp}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>

      {isDialogOpen && <FileUploadDialog isOpen={isDialogOpen} onClose={handleDialogClose} />}
    </header>
  )
}
