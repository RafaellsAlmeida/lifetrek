import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ImpersonationProvider } from "./contexts/ImpersonationContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MobileNav } from "./components/MobileNav";
import { PageTransition } from "./components/PageTransition";
import { ScrollToTop } from "./components/ScrollToTop";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AIChatbot } from "@/components/AIChatbot";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";

// Lazy load route components for better code splitting
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const WhatWeDo = lazy(() => import("./pages/WhatWeDo"));
const Products = lazy(() => import("./pages/Products"));
const Capabilities = lazy(() => import("./pages/Capabilities"));
const TCOCalculator = lazy(() => import("./pages/TCOCalculator"));
const Clients = lazy(() => import("./pages/Clients"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Resources = lazy(() => import("./pages/Resources"));
const Blog = lazy(() => import("./pages/Blog"));


// Admin Pages
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const DashboardOverview = lazy(() => import("./components/admin/DashboardOverview").then(module => ({ default: module.DashboardOverview })));
const Leads = lazy(() => import("./pages/Admin/Leads"));
const Gallery = lazy(() => import("./pages/Admin/Gallery"));
const ProductAssets = lazy(() => import("./pages/Admin/ProductAssets"));
const EnvironmentAssets = lazy(() => import("./pages/Admin/EnvironmentAssets"));
const KnowledgeBase = lazy(() => import("./pages/Admin/KnowledgeBase"));
const RejectionAnalytics = lazy(() => import("./pages/Admin/RejectionAnalytics"));
const ContentApproval = lazy(() => import("./pages/Admin/ContentApproval"));
const ContentCalendar = lazy(() => import("./pages/Admin/ContentCalendar"));
const CampaignManagement = lazy(() => import("./pages/Admin/CampaignManagement"));
const AdminBlog = lazy(() => import("./pages/Admin/AdminBlog"));
const ContentOrchestrator = lazy(() => import("./pages/Admin/ContentOrchestrator"));
const VideoStudio = lazy(() => import("./pages/Admin/VideoStudio"));
const RoiSimulation = lazy(() => import("./pages/Admin/RoiSimulation"));
const OnePager = lazy(() => import("./pages/OnePager"));

// Public Pages
const ProductCatalog = lazy(() => import("./pages/ProductCatalog"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const BlogPostDetails = lazy(() => import("./pages/BlogPostDetails"));
const FatigueValidationGuide = lazy(() => import("./pages/FatigueValidationGuide"));

const queryClient = new QueryClient();

// Main Layout Wrapper
const MainLayout = () => (
  <div className="flex flex-col min-h-screen overflow-x-hidden">
    <Header />
    <main className="flex-1 w-full">
      <PageTransition>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
          <Outlet />
        </Suspense>
      </PageTransition>
    </main>
    <Footer />
    <MobileNav />
    <Footer />
    <MobileNav />
    <AIChatbot />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <ImpersonationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public Routes with Main Layout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/what-we-do" element={<WhatWeDo />} />
                <Route path="/products" element={<Products />} />
                <Route path="/capabilities" element={<Capabilities />} />
                <Route path="/calc" element={<TCOCalculator />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/product-catalog" element={<ProductCatalog />} />
                <Route path="/pitch-deck" element={<PitchDeck />} />
                <Route path="/blog" element={<Blog />} />

                <Route path="/resources" element={<Resources />} />
                <Route path="/resources/fatigue-validation-guide" element={<FatigueValidationGuide />} />
                <Route path="/resources/:slug" element={<ResourceDetail />} />
                <Route path="/blog/:slug" element={<BlogPostDetails />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route element={<ProtectedAdminRoute />}>
                <Route path="/admin" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminLayout>
                      <Outlet />
                    </AdminLayout>
                  </Suspense>
                }>
                  <Route index element={<DashboardOverview />} />
                  <Route path="orchestrator" element={<ContentOrchestrator />} />
                  <Route path="content-approval" element={<ContentApproval />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="content-calendar" element={<ContentCalendar />} />
                  <Route path="campaigns" element={<CampaignManagement />} />
                  <Route path="video-studio" element={<VideoStudio />} />
                  <Route path="roi-simulation" element={<RoiSimulation />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="one-pager" element={<OnePager />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ImpersonationProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
