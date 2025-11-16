import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import Topics from "@/pages/Topics";
import Outcomes from "@/pages/Outcomes";
import Browse from "@/pages/Browse";
import Search from "@/pages/Search";
import Relations from "@/pages/Relations";
import Export from "@/pages/Export";
import ImportPage from "@/pages/Import";
import IntegrationGuide from "@/pages/IntegrationGuide";

type AppProps = {
  datasetReady: Promise<void>;
};

export default function App({ datasetReady }: AppProps) {
  const [status, setStatus] = useState<"pending" | "ready" | "error">("pending");

  useEffect(() => {
    let active = true;
    datasetReady
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((error) => {
        console.error("Dataset bootstrap failed", error);
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [datasetReady]);

  if (status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="text-slate-500">Laen õppekava andmeid…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50">
        <div className="rounded-lg border border-red-200 bg-white px-6 py-4 text-center shadow">
          <h1 className="text-lg font-semibold text-red-700">Andmete laadimine ebaõnnestus</h1>
          <p className="mt-2 text-sm text-red-600">
            Kontrolli, et faili <code>/public/data/oppekava.json</code> sisu on korrektne ja proovi
            uuesti.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="topics" element={<Topics />} />
        <Route path="outcomes" element={<Outcomes />} />
        <Route path="browse" element={<Browse />} />
        <Route path="search" element={<Search />} />
        <Route path="relations" element={<Relations />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="export" element={<Export />} />
        <Route path="documentation" element={<IntegrationGuide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
