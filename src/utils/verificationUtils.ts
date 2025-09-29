import { UserCompanyVerifications } from '../services/userVerificationsApi';

export interface PendingVerificationsCount {
  total: number;
  byCompany: {
    companyId: string;
    companyName: string;
    count: number;
  }[];
}

export const calculatePendingVerifications = (
  companiesVerifications: UserCompanyVerifications[]
): PendingVerificationsCount => {
  let total = 0;
  const byCompany: PendingVerificationsCount['byCompany'] = [];

  companiesVerifications.forEach((companyVerif) => {
    // Count required documents that are not submitted or are rejected/expired
    const pendingCount = companyVerif.verifications.details.filter(verification => 
      verification.isRequired && 
      (verification.status === 'not_submitted' || 
       verification.status === 'rejected' || 
       verification.status === 'expired')
    ).length;

    if (pendingCount > 0) {
      total += pendingCount;
      byCompany.push({
        companyId: companyVerif.company.id,
        companyName: companyVerif.company.name,
        count: pendingCount
      });
    }
  });

  return { total, byCompany };
};

// Check if popup should be shown (once per day)
export const shouldShowDailyPopup = (): boolean => {
  const POPUP_KEY = 'lastVerificationPopupDate';
  const today = new Date().toDateString();
  const lastShown = localStorage.getItem(POPUP_KEY);
  
  return lastShown !== today;
};

// Mark popup as shown today
export const markDailyPopupShown = (): void => {
  const POPUP_KEY = 'lastVerificationPopupDate';
  const today = new Date().toDateString();
  localStorage.setItem(POPUP_KEY, today);
};