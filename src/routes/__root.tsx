import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md">
      <Outlet />
    </div>
  )
}

RootLayout.displayName = 'RootLayout'

export const Route = createRootRoute({ component: RootLayout })
