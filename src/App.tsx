import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import CookieConsent, { CookieConsents } from './components/CookieConsent';
import { trackingService } from './services/trackingService';
import { Layout } from './components/Layout/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RegisterWithInvitation } from './pages/auth/RegisterWithInvitation';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/auth/Unauthorized';
import { Contractors } from './pages/contractors/Contractors';
import { ContractorForm } from './pages/contractors/ContractorForm';
import { ContractorDetail } from './pages/contractors/ContractorDetail';
import { WorkPermits } from './pages/work-permits/WorkPermits';
import { WorkPermitForm } from './pages/work-permits/WorkPermitForm';
import { WorkPermitDetail } from './pages/work-permits/WorkPermitDetail';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Companies } from './pages/companies/Companies';
import { CompanyForm } from './pages/companies/CompanyForm';
import { CompanyDetail } from './pages/companies/CompanyDetail';
import { Courses } from './pages/courses/Courses';
import { CourseEnrollments } from './pages/courses/CourseEnrollments';
import { ContractorProgressPage } from './pages/contractors/ContractorProgress';
import { BulkSync } from './pages/BulkSync';
import { ContractorSearch } from './pages/contractors/ContractorSearch';
// User management pages
import { MyTeams } from './pages/users/MyTeams';
import { TeamMembers } from './pages/users/TeamMembers';
import { MyTasks } from './pages/tasks/MyTasks';
import { TaskDetail } from './pages/tasks/TaskDetail';
import { CompanyUsers } from './pages/users/CompanyUsers';
import { Users } from './pages/users/Users';
import { UserDetail } from './pages/users/UserDetail';
import { UserForm } from './pages/users/UserForm';
import { CompanyUserForm } from './pages/users/CompanyUserForm';
import { CompanyUserDetail } from './pages/users/CompanyUserDetail';
import { InvitationCodes } from './pages/users/InvitationCodes';
import { SupervisedContractors } from './pages/contractors/SupervisedContractors';
import { SupervisedContractorForm } from './pages/contractors/SupervisedContractorForm';
import { SupervisedContractorDetail } from './pages/contractors/SupervisedContractorDetail';
import Notifications from './pages/Notifications';
// Work Permit Template pages
import { TemplateCatalog } from './pages/permits/TemplateCatalog';
import { TemplateDetail } from './pages/permits/TemplateDetail';
import { TemplateForm } from './pages/permits/TemplateForm';
// Form Template pages
import { FormCatalog } from './pages/forms/FormCatalog';
import { FormEditor } from './pages/forms/FormEditor';
import { FormDetail } from './pages/forms/FormDetail';
// Mercado Digital pages
import { Services } from './pages/marketplace/Services';
import { ServiceForm } from './pages/marketplace/ServiceForm';
import { ServiceDetail } from './pages/marketplace/ServiceDetail';
import { WorkRequests } from './pages/marketplace/WorkRequests';
import { WorkRequestForm } from './pages/marketplace/WorkRequestForm';
import { WorkRequestDetail } from './pages/marketplace/WorkRequestDetail';
import { WorkOrders } from './pages/marketplace/WorkOrders';
import { Inspections } from './pages/marketplace/Inspections';
// Legal pages
import { TermsAndConditions } from './pages/legal/TermsAndConditions';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { CookiePolicy } from './pages/legal/CookiePolicy';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3462C7',
    },
    secondary: {
      main: '#678966',
    },
  },
});

function App() {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Inicializar el servicio de tracking
    trackingService.initialize();
    
    // Verificar si ya se dio consentimiento
    const hasConsent = localStorage.getItem('cookie-consent');
    if (!hasConsent) {
      setShowCookieConsent(true);
    }
  }, []);

  const handleCookieConsent = (consents: CookieConsents) => {
    // Actualizar el consentimiento en el servicio de tracking
    trackingService.updateConsent(consents);
    setShowCookieConsent(false);
  };

  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/:sessionId" element={<Register />} />
            <Route path="/register/invitation/:code" element={<RegisterWithInvitation />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/system-users" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="contractors" element={<Contractors />} />
              <Route path="contractors/new" element={<ContractorForm />} />
              <Route path="contractors/:id" element={<ContractorDetail />} />
              <Route path="contractors/:id/edit" element={<ContractorForm />} />
              <Route path="supervised-contractors" element={<SupervisedContractors />} />
              <Route path="supervised-contractors/new" element={<SupervisedContractorForm />} />
              <Route path="supervised-contractors/:id" element={<SupervisedContractorDetail />} />
              <Route path="supervised-contractors/:id/edit" element={<SupervisedContractorForm />} />
              <Route path="work-permits" element={<WorkPermits />} />
              <Route path="work-permits/new" element={<WorkPermitForm />} />
              <Route path="work-permits/:id" element={<WorkPermitDetail />} />
              <Route path="work-permits/:id/edit" element={<WorkPermitForm />} />
              <Route path="work-permits/templates" element={<TemplateCatalog />} />
              <Route path="work-permits/templates/new" element={<TemplateForm />} />
              <Route path="work-permits/templates/:id/edit" element={<TemplateForm />} />
              <Route path="work-permits/templates/:id" element={<TemplateDetail />} />
              <Route path="work-permits/forms" element={<FormCatalog />} />
              <Route path="work-permits/forms/new" element={<FormEditor />} />
              <Route path="work-permits/forms/:id" element={<FormDetail />} />
              <Route path="work-permits/forms/:id/edit" element={<FormEditor />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/new" element={<CompanyForm />} />
              <Route path="companies/:id" element={<CompanyDetail />} />
              <Route path="companies/:id/edit" element={<CompanyForm />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId/enrollments" element={<CourseEnrollments />} />
              <Route path="courses/progress" element={<ContractorProgressPage />} />
              <Route path="courses/bulk-sync" element={<BulkSync />} />
              <Route path="contractor-search" element={<ContractorSearch />} />
              <Route path="users" element={<Users />} />
              <Route path="system-users" element={<Users />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="users/:id/edit" element={<UserForm />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="my-teams" element={<MyTeams />} />
              <Route path="my-teams/:teamId/members" element={<TeamMembers />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="task/:taskId" element={<TaskDetail />} />
              <Route path="company-users" element={<CompanyUsers />} />
              <Route path="company-users/new" element={<CompanyUserForm />} />
              <Route path="company-users/invitation-codes" element={<InvitationCodes />} />
              <Route path="company-users/:id" element={<CompanyUserDetail />} />
              <Route path="company-users/:id/edit" element={<CompanyUserForm />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Mercado Digital Routes */}
              <Route path="marketplace/services" element={<Services />} />
              <Route path="marketplace/services/new" element={<ServiceForm />} />
              <Route path="marketplace/services/:id" element={<ServiceDetail />} />
              <Route path="marketplace/services/:id/edit" element={<ServiceForm />} />
              <Route path="marketplace/work-requests" element={<WorkRequests />} />
              <Route path="marketplace/work-requests/new" element={<WorkRequestForm />} />
              <Route path="marketplace/work-requests/:id" element={<WorkRequestDetail />} />
              <Route path="marketplace/work-requests/:id/edit" element={<WorkRequestForm />} />
              <Route path="marketplace/opportunities" element={<WorkRequests />} />
              <Route path="marketplace/my-bids" element={<WorkRequests />} />
              <Route path="marketplace/work-orders" element={<WorkOrders />} />
              <Route path="marketplace/inspections" element={<Inspections />} />
              <Route path="marketplace/invoices" element={<div>Coming Soon: Invoices</div>} />
              
              {/* Add more routes here as we build them */}
            </Route>
          </Routes>
          
          {/* Cookie Consent Modal */}
          {showCookieConsent && (
            <CookieConsent onAccept={handleCookieConsent} />
          )}
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
