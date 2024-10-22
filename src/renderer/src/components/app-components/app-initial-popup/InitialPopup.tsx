import React, { useState, useContext, ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import UserContext from '@/context/UserContext'

interface InitialPopupProps {
  onClose: () => void
}

const InitialPopup: React.FC<InitialPopupProps> = ({ onClose }) => {
  const { setUser, setEmulate, setApiMode } = useContext(UserContext)
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isShow, setIsShow] = useState<boolean>(true)

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setIsShow(false)
    setUser({ username, password })
    setApiMode(username, password)
    onClose()
  }

  const handleEmulate = (): void => {
    setIsShow(false)
    setEmulate(true)
    onClose()
  }

  return (
    <Dialog open={isShow} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            It will work with emulate local data. However, if you have a{' '}
            <a
              href="https://opensky-network.org/"
              className="underline underline-offset-4 hover:text-primary"
            >
              OpenSky
            </a>{' '}
            account, it will work with live data via the API. To register,{' '}
            <a
              href="https://opensky-network.org/index.php?option=com_users&view=registration"
              className="underline underline-offset-4 hover:text-primary"
            >
              click here
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="username">Username:</Label>
            <Input
              type="text"
              id="username"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="password">Password:</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div className="flex flex-row gap-2">
            <Button variant="secondary" type="button" onClick={handleEmulate} className="w-1/2">
              Emulate
            </Button>
            <Button type="submit" className="w-1/2">
              Login
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default InitialPopup
