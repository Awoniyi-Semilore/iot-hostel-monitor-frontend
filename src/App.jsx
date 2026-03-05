import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import MonitorPage from './pages/MonitorPage';
import HistoryPage from './pages/HistoryPage';
import ContactsPage from './pages/ContactsPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<MonitorPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
