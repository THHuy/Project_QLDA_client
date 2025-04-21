import config from "~/config";

import Home from "~/pages/home";
import Login from "~/pages/login";

import { Dashboard } from "~/components/Dashboard";
const publicRoutes = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: Login },
];
const privateRoutes = [{ path: config.routes.dashboard, component: Dashboard }];
export { privateRoutes, publicRoutes };
