import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { BookingModal } from './components/BookingModal';
import { EmergencyTriageModal } from './components/EmergencyTriageModal';
import { InstallationEstimateModal } from './components/InstallationEstimateModal';
import { MaintenanceRequestModal } from './components/MaintenanceRequestModal';
import { CommercialEnquiryModal } from './components/CommercialEnquiryModal';
import { SaasPricingModal } from './components/SaasPricingModal';
import { AiChatWidget } from './components/AiChatWidget';
import { SetupWizardModal } from './components/SetupWizardModal';
import { LiveEditorToolbar } from './components/LiveEditorToolbar';

// Pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { AboutPage } from './pages/AboutPage';
import { FinancingPage } from './pages/FinancingPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { WarrantiesPage } from './pages/WarrantiesPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ServiceAreasPage } from './pages/ServiceAreasPage';
import { ServiceAreaDetailPage } from './pages/ServiceAreaDetailPage';
import { FaqPage } from './pages/FaqPage';
import { BlogPage } from './pages/BlogPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { ContactPage } from './pages/ContactPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { HvacSizingCalculator } from './components/HvacSizingCalculator';
import { PrivacyPolicyPage, TermsPage, AccessibilityPage, NotFoundPage } from './pages/LegalPages';

const AppRouter: React.FC = () => {
  const { currentRoute, loading, pages } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600 font-heading">Loading Airflow Climate Solutions...</span>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    // Exact routes
    if (currentRoute === '/' || currentRoute === '') return <HomePage />;
    if (currentRoute === '/services') return <ServicesPage />;
    if (currentRoute === '/emergency') return <EmergencyPage />;
    if (currentRoute === '/about' || currentRoute === '/team') return <AboutPage />;
    if (currentRoute === '/financing') return <FinancingPage />;
    if (currentRoute === '/memberships') return <MembershipsPage />;
    if (currentRoute === '/warranties') return <WarrantiesPage />;
    if (currentRoute === '/reviews') return <ReviewsPage />;
    if (currentRoute === '/portfolio') return <PortfolioPage />;
    if (currentRoute === '/service-areas') return <ServiceAreasPage />;
    if (currentRoute === '/faq') return <FaqPage />;
    if (currentRoute === '/blog') return <BlogPage />;
    if (currentRoute === '/promotions') return <PromotionsPage />;
    if (currentRoute === '/contact') return <ContactPage />;
    if (currentRoute === '/portal') return <CustomerPortalPage />;
    if (currentRoute === '/admin' || currentRoute.startsWith('/admin/')) return <AdminDashboardPage />;
    if (currentRoute === '/privacy-policy') return <PrivacyPolicyPage />;
    if (currentRoute === '/terms') return <TermsPage />;
    if (currentRoute === '/accessibility') return <AccessibilityPage />;
    if (currentRoute === '/calculator') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <HvacSizingCalculator />
        </div>
      );
    }

    // Dynamic Parameter Routes
    if (currentRoute.startsWith('/p/')) {
      const slug = currentRoute.replace('/p/', '');
      const page = pages.find((p) => p.slug === slug);
      if (page) {
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">{page.title}</h1>
            <p className="text-slate-600 text-sm leading-relaxed">{page.metaDescription}</p>
            <div className="space-y-6 pt-4">
              {page.blocks.map((b) => (
                <div key={b.id} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-lg text-slate-800 font-heading">{b.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{b.content}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    if (currentRoute.startsWith('/services/')) {
      const slug = currentRoute.replace('/services/', '');
      return <ServiceDetailPage slug={slug} />;
    }

    if (currentRoute.startsWith('/service-areas/')) {
      const slug = currentRoute.replace('/service-areas/', '');
      return <ServiceAreaDetailPage slug={slug} />;
    }

    if (currentRoute.startsWith('/blog/')) {
      const slug = currentRoute.replace('/blog/', '');
      return <ArticleDetailPage slug={slug} />;
    }

    return <NotFoundPage />;
  };

  // Dedicated Admin Portal renders without public header/footer
  if (currentRoute === '/admin' || currentRoute.startsWith('/admin/')) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <AdminDashboardPage />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">{renderCurrentView()}</main>
      <Footer />

      {/* Modals & Floating Widgets */}
      <BookingModal />
      <EmergencyTriageModal />
      <InstallationEstimateModal />
      <MaintenanceRequestModal />
      <CommercialEnquiryModal />
      <SaasPricingModal />
      <SetupWizardModal />
      <AiChatWidget />
      <LiveEditorToolbar />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
