import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import Topics from "@/pages/Topics";
import Outcomes from "@/pages/Outcomes";
import Browse from "@/pages/Browse";
import Search from "@/pages/Search";
import Relations from "@/pages/Relations";
import Import from "@/pages/Import";
import Export from "@/pages/Export";

export default function App() {
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
        <Route path="import" element={<Import />} />
        <Route path="export" element={<Export />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
