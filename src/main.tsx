import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import { curriculum } from "./api/curriculumClient";
import "./index.css";

const queryClient = new QueryClient();
const datasetReady = curriculum.load().catch((error) => {
  console.error("Failed to load curriculum dataset", error);
});

const basename =
  import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <App datasetReady={datasetReady} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
