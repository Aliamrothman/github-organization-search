import { RootRoute, Route, Router } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import AppLayout from 'app/AppLayout'
import { DemoPage } from 'components/pages/DemoPage/DemoPage'
import { UserDetails } from 'components/pages/UserDetails/UserDetails'

// Create the root route
export const rootRoute = new RootRoute({
  component: AppLayout
})

// Create the index route
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DemoPage
})

// Create the user details route
const userDetailsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/org/$org/repo/$repo',
  component: UserDetails
})

// Create the not found route
const notFoundRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '*',
  component: () => <div>Page not found</div>
})

// Create the route tree
const routeTree = rootRoute.addChildren([indexRoute, userDetailsRoute, notFoundRoute])

// Create and export the router
export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  basepath: '/github-organization-search',
})
