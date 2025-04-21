import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { publicRoutes, privateRoutes } from "~/routes";
import { PrivateRoute } from "./components/ProtectRoute/PrivateRoute";
import { AuthProvider } from "./components/contexts/AuthContext";
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map((route, index) => {
              const Page = route.component;
              // let Layout = DefaultLayout;

              // if (route.layout) {
              //   Layout = route.layout;
              // } else if (route.layout === null) {
              //   Layout = Fragment;
              // }

              return <Route key={index} path={route.path} element={<Page />} />;
            })}
            {/* Private Routes */}
            {privateRoutes.map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={index}
                  path={route.path}
                  element={
                    <PrivateRoute>
                      <Page />
                    </PrivateRoute>
                  }
                />
              );
            })}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
