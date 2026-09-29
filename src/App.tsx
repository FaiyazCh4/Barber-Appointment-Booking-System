import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';
import { HomeView } from './views/HomeView';
import { ServicesView } from './views/ServicesView';
import { TeamView } from './views/TeamView';
import { GalleryView } from './views/GalleryView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { BookingView } from './views/BookingView';
import { ManageAppointmentView } from './views/ManageAppointmentView';
import { PoliciesView } from './views/PoliciesView';
import { AdminView } from './views/AdminView';
import { fetchCurrentUser, fetchSalonConfig, fetchServices, fetchStaff, logoutUser } from './api/client';
import { supabase } from './lib/supabase';
import type { SalonConfig, Service, ServiceCategory, Staff, UserProfile } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewContext, setViewContext] = useState<any>({});

  const [config, setConfig] = useState<SalonConfig | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Data Load
  const loadAllData = async () => {
    try {
      const [cfg, srvData, stData, usr] = await Promise.all([
        fetchSalonConfig(),
        fetchServices(),
        fetchStaff(),
        fetchCurrentUser(),
      ]);
      setConfig(cfg);
      setCategories(srvData.categories);
      setServices(srvData.services);
      setStaff(stData.staff);
      setUser(usr);
    } catch (err) {
      console.error('Error initializing app data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // 1. Explicitly clear local application state variables so admin session is destroyed
    setUser(null);
    setViewContext({});

    // 2. Explicitly call Supabase auth.signOut() and full cleanup
    try {
      if (supabase?.auth) {
        await supabase.auth.signOut();
      }
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }

    // 3. Re-sync fresh unauthenticated state
    await loadAllData();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleNavigate = (view: string, context: any = {}) => {
    if (view === 'vouchers') {
      setCurrentView('book');
      setViewContext({ ...context, mode: 'voucher' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentView(view);
    setViewContext(context);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookService = (serviceId: string, staffId?: string) => {
    handleNavigate('book', { preSelectedServiceId: serviceId, preSelectedStaffId: staffId });
  };

  const handleBookStylist = (staffId: string) => {
    handleNavigate('book', { preSelectedStaffId: staffId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-[#F5F1EA] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#9B8058] border-t-transparent rounded-full animate-spin" />
        <span className="font-serif-heading text-xl tracking-wide text-[#D9D1C5]">
          George Davis Hairdressing
        </span>
        <span className="text-xs text-[#8C8273]">Loading salon schedule...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#F5F1EA]">
      {/* Top Banner Notice */}
      <AnnouncementBanner config={config} onNavigate={handleNavigate} />

      {/* Primary Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={() => handleNavigate('admin')}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div key={currentView} className="animate-view-transition">
          {currentView === 'home' && (
            <HomeView
              config={config}
              services={services}
              staff={staff}
              onNavigate={handleNavigate}
              onBookService={handleBookService}
            />
          )}

          {currentView === 'services' && (
            <ServicesView
              categories={categories}
              services={services}
              onBookService={handleBookService}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'team' && (
            <TeamView staff={staff} onBookStylist={handleBookStylist} />
          )}

          {currentView === 'gallery' && <GalleryView />}

          {currentView === 'about' && <AboutView onNavigate={handleNavigate} />}

          {currentView === 'contact' && <ContactView config={config} />}

          {currentView === 'book' && (
            <BookingView
              config={config}
              services={services}
              staff={staff}
              user={user}
              preSelectedServiceId={viewContext?.preSelectedServiceId}
              preSelectedStaffId={viewContext?.preSelectedStaffId}
              initialMode={viewContext?.mode}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'manage' && (
            <ManageAppointmentView
              user={user}
              initialReference={viewContext?.reference}
              initialEmail={viewContext?.email}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'policies' && <PoliciesView />}

          {currentView === 'admin' && (
            <AdminView
              user={user}
              config={config}
              services={services}
              staff={staff}
              onRefreshData={loadAllData}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer config={config} user={user} onNavigate={handleNavigate} onLogout={handleLogout} />

      {/* Mobile Sticky Bar (Hidden on Booking View and Admin) */}
      {currentView !== 'book' && currentView !== 'admin' && (
        <MobileStickyBar onBookClick={() => handleNavigate('book')} />
      )}
    </div>
  );
}
