import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { OrgChartPage } from './pages/OrgChartPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { UploadDataPage } from './pages/UploadDataPage';
import { ComparePage } from './pages/ComparePage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<OrgChartPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/upload" element={<UploadDataPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
