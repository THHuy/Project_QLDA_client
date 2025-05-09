import config from "~/config";
//Public Routes Page
import Home from "~/pages/home";
import Login from "~/pages/login";
//Private Routes Page
import { Dashboard } from "~/pages/Dashboard";
import Projects from "~/pages/Projects";
import YourWork from "~/pages/ForYou";
import Teams from "~/pages/Teams";
import ProjectID from "~/components/Layout/ProjectID";
import Directory from "~/pages/Directory";
import Overview from "~/pages/Overview";
import ManagerTeams from "~/pages/ManagerTeams";
//Layout
import ManagerUsersLayout from "~/components/Layout/ManagerUserLayout";
const publicRoutes = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: Login },
];
const privateRoutes = [
  { path: config.routes.dashboard, component: Dashboard },
  { path: config.routes.projects, component: Projects },
  { path: config.routes.foryou, component: YourWork },
  { path: config.routes.foryouproduct, component: YourWork },
  { path: config.routes.teams, component: Teams },
  { path: config.routes.projectsID, component: ProjectID },
  {
    path: config.routes.user,
    component: Directory,
    layout: ManagerUsersLayout,
  },
  {
    path: config.routes.overview,
    component: Overview,
    layout: ManagerUsersLayout,
  },
  {
    path: config.routes.managerTeam,
    component: ManagerTeams,
    layout: ManagerUsersLayout,
  },
];
export { privateRoutes, publicRoutes };
