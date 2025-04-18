import config from "~/config";

import Home from "~/pages/home";
import Login from "~/pages/login";
const publicRoutes = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: Login },
];
const privateRoutes = [];
export { privateRoutes, publicRoutes };
