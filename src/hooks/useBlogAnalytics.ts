
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useBlogAnalytics(postId?: string) {
  // Use a ref to track if we've already initialized for this post to avoid double counting in strict mode
  const initialized = useRef(false);
  const sessionIdRef = useRef<string>('');
  
  // Ref to store the analytics row ID
  const analyticsIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!postId || initialized.current) return;
    
    initialized.current = true;
    
    // 1. Get or create Session ID
    let sessionId = localStorage.getItem('blog_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('blog_session_id', sessionId);
    }
    sessionIdRef.current = sessionId;
    
    // 2. Extract UTM params and User Info
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    
    // Try to get email from local storage (if previously captured) or auth
    // Note: For now we rely on anonymous tracking or whatever is available
    const userEmail = localStorage.getItem('user_email'); 
    
    // 3. Initial View Record
    const startTime = Date.now();
    let maxScroll = 0;
    
    // Function to extract domain
    const extractDomain = (email: string | null) => {
        if (!email || !email.includes('@')) return null;
        return email.split('@')[1].toLowerCase();
    };

    const recordView = async () => {
      const { data } = await (supabase.from('blog_analytics' as any).insert({
        post_id: postId,
        session_id: sessionId!,
        user_email: userEmail,
        company_domain: extractDomain(userEmail),
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer: document.referrer,
        viewed_at: new Date().toISOString(),
        time_on_page: 0,
        scroll_depth: 0
      }).select('id').single() as any);

      if (data) {
        analyticsIdRef.current = (data as any).id;
      }
    };

    recordView();
    
    // 4. Scroll Tracking
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }
    };
    
    // Throttle scroll event
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = undefined!;
        }, 500);
      }
    };
    
    window.addEventListener('scroll', throttledScroll);
    
    // 5. Update on Leave (Time on Page & Max Scroll)
    const handleUnload = () => {
      if (!analyticsIdRef.current) return;
      
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      
      (supabase.from('blog_analytics' as any).update({
        time_on_page: timeOnPage,
        scroll_depth: maxScroll
      }).eq('id', analyticsIdRef.current) as any).then(({ error }: any) => {
         if (error) console.error("Error updating analytics:", error);
      });
    };
    
    // Handle both component unmount and window unload
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      handleUnload();
    };
    
  }, [postId]);
  
  // Helper to track CTA clicks
  const trackCtaClick = async () => {
    if (!postId || !sessionIdRef.current) return;
    
    await (supabase.from('blog_analytics' as any).update({
        cta_clicked: true
    }).match({ 
        session_id: sessionIdRef.current, 
        post_id: postId 
    }) as any);
  };
  
  return { trackCtaClick };
}
