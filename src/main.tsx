import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProgramyPage from "./ProgramyPage";
import ProgramTrendPage from "./ProgramTrendPage";
import CompetitionPage from "./CompetitionPage";
import './index.css'

const router = createBrowserRouter([
  { path: "/", element: <ProgramyPage /> },
  { path: "/trend", element: <ProgramTrendPage /> },
  { path: "/konkurencja", element: <CompetitionPage /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
