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
const Leads = lazy(() => import("./pages/AdminLeads"));
// const Gallery = lazy(() => import("./pages/Admin/Gallery"));
// const Gallery = lazy(() => import("./pages/Admin/Gallery"));
const RejectionAnalytics = lazy(() => import("./pages/Admin/RejectionAnalytics"));
const ContentApproval = lazy(() => import("./pages/Admin/ContentApproval"));
const ContentCalendar = lazy(() => import("./pages/Admin/ContentCalendar"));
const CampaignManagement = lazy(() => import("./pages/Admin/CampaignManagement"));
const AdminBlog = lazy(() => import("./pages/Admin/AdminBlog"));
const ContentOrchestrator = lazy(() => import("./pages/Admin/ContentOrchestrator"));
const VideoStudio = lazy(() => import("./pages/Admin/VideoStudio"));
const RoiSimulation = lazy(() => import("./pages/Admin/RoiSimulation"));
const UnifiedAnalytics = lazy(() => import("./pages/Admin/UnifiedAnalytics"));
const UnifiedInbox = lazy(() => import("./pages/UnifiedInbox"));
const OnePager = lazy(() => import("./pages/OnePager"));
const ContentManager = lazy(() => import("./pages/Admin/ContentManager"));
const ImageEditor = lazy(() => import("./pages/Admin/ImageEditor"));
const SocialMediaWorkspace = lazy(() => import("./pages/Admin/SocialMediaWorkspace"));
const ChatbotInbox = lazy(() => import("./pages/Admin/ChatbotInbox"));
const ContentPreview = lazy(() => import("./pages/Admin/ContentPreview"));
const AdminGenerator = lazy(() => import("./pages/Admin/AdminGenerator"));
const LinkedInCarousel = lazy(() => import("./pages/LinkedInCarousel"));

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
    <AIChatbot />
  </div>
);

const App = () => (
  <HelmetProvider>
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
                    <Route path="rejection-analytics" element={<RejectionAnalytics />} />
                    <Route path="content-calendar" element={<ContentCalendar />} />
                    <Route path="campaigns" element={<CampaignManagement />} />
                    <Route path="video-studio" element={<VideoStudio />} />
                    <Route path="roi-simulation" element={<RoiSimulation />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="analytics" element={<UnifiedAnalytics />} />
                    <Route path="inbox" element={<UnifiedInbox />} />
                    <Route path="one-pager" element={<OnePager />} />
                    <Route path="content-manager" element={<ContentManager />} />
                    <Route path="linkedin-carousel" element={<LinkedInCarousel />} />
                    <Route path="image-editor" element={<ImageEditor />} />
                    <Route path="social" element={<SocialMediaWorkspace />} />
                    <Route path="chatbot-inbox" element={<ChatbotInbox />} />
                    <Route path="content-preview/:type/:id" element={<ContentPreview />} />
                    <Route path="generator" element={<AdminGenerator />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </ImpersonationProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
