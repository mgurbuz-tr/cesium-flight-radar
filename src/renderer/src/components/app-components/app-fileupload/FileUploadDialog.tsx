import React, { useState, useContext, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import UserContext from '@/context/UserContext'

interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
}

const FileUploadDialog = ({ isOpen, onClose }: Readonly<FileUploadDialogProps>): ReactNode => {
  const { addKmlFile } = useContext(UserContext)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files?.[0]) {
      const selectedFile = event.target.files[0]
      if (
        selectedFile.type === 'application/vnd.google-earth.kml+xml' ||
        selectedFile.name.endsWith('.kml')
      ) {
        setFile(selectedFile)
      } else {
        alert('Please select a valid KML file.')
      }
    }
  }

  const simulateUpload = (): void => {
    setIsUploading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prevProgress + 10
      })
    }, 500)
  }

  const handleUpload = (): void => {
    if (file) {
      simulateUpload()
      setTimeout(() => {
        addKmlFile(file)
        onClose()
        setFile(null)
        setProgress(0)
      }, 5000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Select the KML file you want to upload and click the &#34;Upload&#34; button.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".kml,application/vnd.google-earth.kml+xml"
              className="col-span-3"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          {file && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FileUploadDialog
