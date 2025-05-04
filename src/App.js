import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { publicRoutes, privateRoutes } from "~/routes";
import { PrivateRoute } from "./components/ProtectRoute/PrivateRoute";
import { AuthProvider } from "./components/contexts/AuthContext";
import DefaultLayout from "./components/Layout/DefaultLayout";
import { Fragment } from "react";
import { App, ConfigProvider, message } from "antd";
import { useEffect } from "react";

function AppWrapper() {
  return (
    <ConfigProvider>
      <App>
        <MainApp />
      </App>
    </ConfigProvider>
  );
}

function MainApp() {
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    window.message = messageApi;
  }, [messageApi]);

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {contextHolder}
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map((route, index) => {
              const Page = route.component;
              return <Route key={index} path={route.path} element={<Page />} />;
            })}

            {/* Private Routes */}
            {privateRoutes.map((route, index) => {
              const Page = route.component;
              let Layout = DefaultLayout;

              if (route.layout) {
                Layout = route.layout;
              } else if (route.layout === null) {
                Layout = Fragment;
              }

              return (
                <Route
                  key={index}
                  path={route.path}
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Page />
                      </Layout>
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

export default AppWrapper;
