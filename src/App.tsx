import { Suspense, lazy, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useLanguage } from "./contexts/LanguageContext";
import { ImpersonationProvider } from "./contexts/ImpersonationContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MobileNav } from "./components/MobileNav";
import { PageTransition } from "./components/PageTransition";
import { ScrollToTop } from "./components/ScrollToTop";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { SeoMetadata } from "./components/SeoMetadata";
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
const AdminBlog = lazy(() => import("./pages/Admin/AdminBlog"));
const ContentOrchestrator = lazy(() => import("./pages/Admin/ContentOrchestrator"));
const UnifiedAnalytics = lazy(() => import("./pages/Admin/UnifiedAnalytics"));
const AdminResources = lazy(() => import("./pages/Admin/AdminResources"));
// const UnifiedInbox = lazy(() => import("./pages/UnifiedInbox")); // Paused while Unipile is disabled
const OnePager = lazy(() => import("./pages/OnePager"));
const ImageEditor = lazy(() => import("./pages/Admin/ImageEditor"));
const SocialMediaWorkspace = lazy(() => import("./pages/Admin/SocialMediaWorkspace"));
const ChatbotInbox = lazy(() => import("./pages/Admin/ChatbotInbox"));
const ContentPreview = lazy(() => import("./pages/Admin/ContentPreview"));
const AdminGenerator = lazy(() => import("./pages/Admin/AdminGenerator"));
const TechnicalDrawing = lazy(() => import("./pages/Admin/TechnicalDrawing"));
const LinkedInCarousel = lazy(() => import("./pages/LinkedInCarousel"));

// Public Pages
const ProductCatalog = lazy(() => import("./pages/ProductCatalog"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const BlogPostDetails = lazy(() => import("./pages/BlogPostDetails"));
const FatigueValidationGuide = lazy(() => import("./pages/FatigueValidationGuide"));
const StakeholderReviewPage = lazy(() => import("./pages/StakeholderReview/StakeholderReviewPage"));

const queryClient = new QueryClient();

type PublicLanguage = "en" | "pt";

const LocaleLayout = ({ language }: { language: PublicLanguage }) => {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage(language);
  }, [language, setLanguage]);

  return <MainLayout />;
};

// Main Layout Wrapper
const MainLayout = () => (
  <div className="flex flex-col min-h-screen overflow-x-hidden">
    <SeoMetadata />
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

const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/about", element: <About /> },
  { path: "/what-we-do", element: <WhatWeDo /> },
  { path: "/products", element: <Products /> },
  { path: "/capabilities", element: <Capabilities /> },
  { path: "/calc", element: <TCOCalculator /> },
  { path: "/clients", element: <Clients /> },
  { path: "/contact", element: <Contact /> },
  { path: "/assessment", element: <Assessment /> },
  { path: "/calculator", element: <Calculator /> },
  { path: "/product-catalog", element: <ProductCatalog /> },
  { path: "/pitch-deck", element: <PitchDeck /> },
  { path: "/blog", element: <Blog /> },
  { path: "/resources", element: <Resources /> },
  { path: "/resources/fatigue-validation-guide", element: <FatigueValidationGuide /> },
  { path: "/resources/:slug", element: <ResourceDetail /> },
  { path: "/blog/:slug", element: <BlogPostDetails /> },
  { path: "*", element: <NotFound /> },
];

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
                <Route element={<LocaleLayout language="pt" />}>
                  {publicRoutes.map((route) => (
                    <Route key={`default-${route.path}`} path={route.path} element={route.element} />
                  ))}
                </Route>

                <Route path="/en" element={<LocaleLayout language="en" />}>
                  {publicRoutes.map((route) => (
                    <Route
                      key={`en-${route.path}`}
                      index={route.path === "/"}
                      path={route.path === "/" ? undefined : route.path.replace(/^\//, "")}
                      element={route.element}
                    />
                  ))}
                </Route>

                <Route path="/pt" element={<LocaleLayout language="pt" />}>
                  {publicRoutes.map((route) => (
                    <Route
                      key={`pt-${route.path}`}
                      index={route.path === "/"}
                      path={route.path === "/" ? undefined : route.path.replace(/^\//, "")}
                      element={route.element}
                    />
                  ))}
                </Route>

                {/* Admin Routes */}
                <Route
                  path="/review/:token"
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                      <StakeholderReviewPage />
                    </Suspense>
                  }
                />

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
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="analytics" element={<UnifiedAnalytics />} />
                    <Route path="resources" element={<AdminResources />} />
                    {/* Inbox route paused while Unipile is disabled */}
                    <Route path="inbox" element={<Navigate to="/admin/chatbot-inbox" replace />} />
                    <Route path="one-pager" element={<OnePager />} />
                    <Route path="content-manager" element={<Navigate to="/admin/content-approval" replace />} />
                    <Route path="linkedin-carousel" element={<LinkedInCarousel />} />
                    <Route path="image-editor" element={<ImageEditor />} />
                    <Route path="social" element={<SocialMediaWorkspace />} />
                    <Route path="chatbot-inbox" element={<ChatbotInbox />} />
                    <Route path="content-preview/:type/:id" element={<ContentPreview />} />
                    <Route path="generator" element={<AdminGenerator />} />
                    <Route path="desenho-tecnico" element={<TechnicalDrawing />} />
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
