import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  styled,
  keyframes,
} from '@mui/material';

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const ShimmerSkeleton = styled(Skeleton)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100],
  '&::after': {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transform: 'translateX(-100%)',
    background: `linear-gradient(
      90deg,
      transparent,
      ${theme.palette.grey[50]},
      transparent
    )`,
    animation: `${shimmer} 1.5s infinite`,
    content: '""',
  },
}));

const PulseBox = styled(Box)(({ theme }) => ({
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
}));

interface SkeletonLoaderProps {
  variant?: 'table' | 'cards' | 'compact' | 'alphabetical-list';
  rows?: number;
  showStats?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'table',
  rows = 5,
  showStats = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  // Alphabetical List variant (for FormCatalog)
  if (variant === 'alphabetical-list') {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header Skeleton */}
        <PulseBox sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: 2 
          }}>
            <ShimmerSkeleton variant="text" width={250} height={isXs ? 32 : 40} />
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              {!isMobile && (
                <>
                  <ShimmerSkeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
                  <ShimmerSkeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
                </>
              )}
              <ShimmerSkeleton 
                variant="rectangular" 
                width={isXs ? '100%' : 140} 
                height={36} 
                sx={{ borderRadius: 1 }} 
              />
            </Box>
          </Box>
        </PulseBox>

        {/* Mobile Filter Buttons */}
        {isMobile && (
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <ShimmerSkeleton 
              variant="rectangular" 
              sx={{ borderRadius: 1, flex: 1 }} 
              height={36} 
            />
            <ShimmerSkeleton 
              variant="rectangular" 
              sx={{ borderRadius: 1, flex: 1 }} 
              height={36} 
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Alphabet Sidebar - Desktop only */}
          {!isMobile && (
            <Paper sx={{ p: 1, height: 'fit-content' }}>
              <PulseBox>
                {Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerSkeleton 
                    key={i}
                    variant="rectangular" 
                    width={40} 
                    height={32} 
                    sx={{ mb: 0.5, borderRadius: 0.5 }} 
                  />
                ))}
              </PulseBox>
            </Paper>
          )}

          {/* Main List Content */}
          <Box sx={{ flex: 1 }}>
            {/* Letter Groups */}
            {Array.from({ length: 3 }).map((_, groupIndex) => (
              <Box key={groupIndex} sx={{ mb: 3 }}>
                {/* Letter Header */}
                <Box sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 1,
                  borderRadius: 1
                }}>
                  <PulseBox sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <ShimmerSkeleton variant="circular" width={40} height={40} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShimmerSkeleton variant="text" width={20} height={24} />
                      <ShimmerSkeleton variant="rectangular" width={100} height={20} sx={{ borderRadius: 3 }} />
                    </Box>
                  </PulseBox>
                </Box>

                {/* Form Items in this group */}
                {Array.from({ length: 2 }).map((_, itemIndex) => (
                  <Box key={itemIndex}>
                    <Box sx={{ 
                      p: 2, 
                      '&:hover': { bgcolor: 'action.hover' },
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2
                    }}>
                      <PulseBox sx={{ display: 'flex', flex: 1, gap: 2, alignItems: 'flex-start' }}>
                        <ShimmerSkeleton variant="circular" width={isXs ? 32 : 40} height={isXs ? 32 : 40} />
                        <Box sx={{ flex: 1 }}>
                          {/* Title and chips */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <ShimmerSkeleton variant="text" width={200} height={24} />
                            <ShimmerSkeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 3 }} />
                            <ShimmerSkeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 3 }} />
                          </Box>
                          {/* Description */}
                          <ShimmerSkeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
                          {/* Meta info */}
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                            <ShimmerSkeleton variant="rectangular" width={100} height={18} sx={{ borderRadius: 3 }} />
                            <ShimmerSkeleton variant="text" width={60} height={16} />
                            <ShimmerSkeleton variant="text" width={80} height={16} />
                          </Box>
                        </Box>
                      </PulseBox>
                      {/* Action buttons - Desktop only */}
                      {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <ShimmerSkeleton variant="circular" width={32} height={32} />
                          <ShimmerSkeleton variant="circular" width={32} height={32} />
                          <ShimmerSkeleton variant="circular" width={32} height={32} />
                        </Box>
                      )}
                    </Box>
                    {itemIndex < 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', ml: 7 }} />}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Mobile Alphabet - Floating */}
        {isMobile && (
          <Paper sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            p: 1,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 200,
            gap: 0.5,
            boxShadow: theme.shadows[8],
          }}>
            <PulseBox>
              {Array.from({ length: 6 }).map((_, i) => (
                <ShimmerSkeleton 
                  key={i}
                  variant="rectangular" 
                  width={32} 
                  height={32} 
                  sx={{ borderRadius: 0.5, display: 'inline-block', m: 0.25 }} 
                />
              ))}
            </PulseBox>
          </Paper>
        )}
      </Box>
    );
  }
  
  if (variant === 'cards' || (variant === 'table' && isMobile)) {
    return (
      <Box>
        {/* Header Skeleton */}
        <PulseBox sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <ShimmerSkeleton variant="text" width={200} height={40} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ShimmerSkeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              <ShimmerSkeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
              <ShimmerSkeleton variant="rectangular" width={140} height={36} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        </PulseBox>

        {/* Cards Skeleton */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: rows }).map((_, index) => (
            <Card key={index} sx={{ position: 'relative' }}>
              <CardContent>
                <PulseBox>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <ShimmerSkeleton variant="text" width="70%" height={28} sx={{ mb: 0.5 }} />
                      <ShimmerSkeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                      <ShimmerSkeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 3 }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <ShimmerSkeleton variant="circular" width={32} height={32} />
                      <ShimmerSkeleton variant="circular" width={32} height={32} />
                      <ShimmerSkeleton variant="circular" width={32} height={32} />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                    <Box>
                      <ShimmerSkeleton variant="text" width={80} height={16} />
                      <ShimmerSkeleton variant="text" width="90%" height={20} />
                    </Box>
                    <Box>
                      <ShimmerSkeleton variant="text" width={60} height={16} />
                      <ShimmerSkeleton variant="text" width="80%" height={20} />
                    </Box>
                    <Box>
                      <ShimmerSkeleton variant="text" width={70} height={16} />
                      <ShimmerSkeleton variant="text" width="50%" height={20} />
                    </Box>
                    <Box>
                      <ShimmerSkeleton variant="text" width={50} height={16} />
                      <ShimmerSkeleton variant="text" width="85%" height={20} />
                    </Box>
                    <Box sx={{ gridColumn: 'span 2' }}>
                      <ShimmerSkeleton variant="text" width={120} height={16} />
                      <ShimmerSkeleton variant="text" width="40%" height={20} />
                    </Box>
                  </Box>
                </PulseBox>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Pagination Skeleton */}
        <Paper sx={{ mt: 2 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <PulseBox>
              <ShimmerSkeleton variant="text" width={120} height={20} />
            </PulseBox>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ShimmerSkeleton variant="circular" width={32} height={32} />
              <ShimmerSkeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
              <ShimmerSkeleton variant="circular" width={32} height={32} />
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Skeleton */}
      <PulseBox sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ShimmerSkeleton variant="text" width={200} height={40} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ShimmerSkeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            <ShimmerSkeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
            <ShimmerSkeleton variant="rectangular" width={140} height={36} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      </PulseBox>

      {/* Table Skeleton */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {/* Table Headers */}
              {[
                'Espacios de Trabajo',
                'Identificación Fiscal', 
                'Industria',
                'Empleados',
                'Contacto',
                'Estado',
                'Fecha Registro',
                'Acciones'
              ].map((header, index) => (
                <TableCell key={index}>
                  <PulseBox>
                    <ShimmerSkeleton 
                      variant="text" 
                      width={index === 0 ? 120 : index === 7 ? 80 : 100} 
                      height={20} 
                    />
                  </PulseBox>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex} hover>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
                    <ShimmerSkeleton variant="text" width="60%" height={16} />
                  </PulseBox>
                </TableCell>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="text" width="90%" height={20} />
                  </PulseBox>
                </TableCell>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="text" width="70%" height={20} />
                  </PulseBox>
                </TableCell>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="text" width="40%" height={20} />
                  </PulseBox>
                </TableCell>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="text" width="85%" height={20} sx={{ mb: 0.5 }} />
                    <ShimmerSkeleton variant="text" width="50%" height={16} />
                  </PulseBox>
                </TableCell>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 3 }} />
                  </PulseBox>
                </TableCell>
                <TableCell>
                  <PulseBox>
                    <ShimmerSkeleton variant="text" width="60%" height={20} />
                  </PulseBox>
                </TableCell>
                <TableCell align="center">
                  <PulseBox>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <ShimmerSkeleton variant="circular" width={32} height={32} />
                      <ShimmerSkeleton variant="circular" width={32} height={32} />
                      <ShimmerSkeleton variant="circular" width={32} height={32} />
                    </Box>
                  </PulseBox>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Skeleton */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <PulseBox>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShimmerSkeleton variant="text" width={100} height={20} />
              <ShimmerSkeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </PulseBox>
          <PulseBox>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShimmerSkeleton variant="text" width={120} height={20} />
              <ShimmerSkeleton variant="circular" width={32} height={32} />
              <ShimmerSkeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
              <ShimmerSkeleton variant="circular" width={32} height={32} />
            </Box>
          </PulseBox>
        </Box>
      </TableContainer>
    </Box>
  );
};

export default SkeletonLoader;