export const workRequestStatusMap: Record<string, string> = {
  // Spanish to English mappings
  'borrador': 'draft',
  'publicado': 'published',
  'licitando': 'bidding',
  'adjudicado': 'awarded',
  'completado': 'completed',
  'cancelado': 'cancelled',
  // English to English (passthrough)
  'draft': 'draft',
  'published': 'published',
  'bidding': 'bidding',
  'awarded': 'awarded',
  'completed': 'completed',
  'cancelled': 'cancelled'
};

export const normalizeWorkRequestStatus = (status: string): string => {
  return workRequestStatusMap[status] || status;
};

export const getSpanishStatus = (englishStatus: string): string => {
  const spanishMap: Record<string, string> = {
    'draft': 'borrador',
    'published': 'publicado',
    'bidding': 'licitando',
    'awarded': 'adjudicado',
    'completed': 'completado',
    'cancelled': 'cancelado'
  };
  return spanishMap[englishStatus] || englishStatus;
};