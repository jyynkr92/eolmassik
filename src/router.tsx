import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { HomeRoute } from './routes/home'
import { SharedRoute } from './routes/shared'

const rootRoute = createRootRoute({
  component: () => (
    <div className="mx-auto min-h-dvh w-full max-w-md">
      <Outlet />
    </div>
  ),
})

/** [1]~[4] 정산 작성 및 결과. */
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeRoute,
})

/**
 * [5] 공유받은 결과 (읽기 전용).
 *
 * 정산 데이터는 `/s#<encoded>` 형태로 URL fragment에 담긴다. fragment는
 * 서버로 전송되지 않으므로 서버 로그에 데이터가 남지 않고, 서버 측 URL
 * 길이 제한도 받지 않는다. (기획설계 6.2)
 */
const sharedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s',
  component: SharedRoute,
})

const routeTree = rootRoute.addChildren([homeRoute, sharedRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
