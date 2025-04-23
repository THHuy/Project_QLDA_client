import config from "~/config";
//Public Routes Page
import Home from "~/pages/home";
import Login from "~/pages/login";
//Private Routes Page
import { Dashboard } from "~/pages/Dashboard";
import Projects from "~/pages/Projects";
import YourWork from "~/pages/ForYou";
import Teams from "~/pages/Teams";
const publicRoutes = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: Login },
];
const privateRoutes = [
  { path: config.routes.dashboard, component: Dashboard },
  { path: config.routes.projects, component: Projects },
  { path: config.routes.foryou, component: YourWork },
  { path: config.routes.teams, component: Teams },
];
export { privateRoutes, publicRoutes };
