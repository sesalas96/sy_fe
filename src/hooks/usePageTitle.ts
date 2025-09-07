import { useEffect } from 'react';

export const usePageTitle = (title: string, description?: string) => {
  useEffect(() => {
    // Update document title immediately
    document.title = title;
    
    // Update meta description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Safety';
    };
  }, [title, description]);
};

// Helper function to get consistent page titles
export const getPageTitle = (pageName: string): string => {
  return `${pageName}`;
};