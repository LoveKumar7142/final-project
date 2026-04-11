import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import PublicLayout from "../layouts/PublicLayout";
import GlobalError from "../pages/GlobalError";
import AppLoader from "../components/ui/AppLoader";

// Lazy loaded routes for extreme speed (Code Splitting)
const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const Projects = lazy(() => import("../pages/Projects"));
const ProjectDetail = lazy(() => import("../pages/ProjectDetail"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Hire = lazy(() => import("../pages/Hire"));
const Contact = lazy(() => import("../pages/Contact"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Helper wrapper
const withSuspense = (Component: React.ElementType) => (
  <Suspense fallback={<AppLoader isLoading={true} message="Loading chunk..." />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <GlobalError />,
    children: [
      { index: true, element: withSuspense(Home) },
      { path: "about", element: withSuspense(About) },
      { path: "projects", element: withSuspense(Projects) },
      { path: "projects/:id", element: withSuspense(ProjectDetail) },
      { path: "hire", element: withSuspense(Hire) },
      { path: "contact", element: withSuspense(Contact) },
      { path: "dashboard", element: withSuspense(Dashboard) },
      { path: "login", element: withSuspense(Login) },
      { path: "register", element: withSuspense(Register) },
      { path: "forgot-password", element: withSuspense(ForgotPassword) },
      { path: "reset-password/:userId/:token", element: withSuspense(ResetPassword) },
      { path: "*", element: withSuspense(NotFound) },
    ],
  },
]);

export default router;
