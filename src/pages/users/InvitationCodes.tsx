import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
  Key as CodeIcon,
  Email as EmailIcon,
  Upload as UploadIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

interface TemporaryCode {
  id: string;
  code: string;
  company: {
    id: string;
    name: string;
  };
  role: UserRole;
  description?: string;
  maxUses: number;
  currentUses: number;
  usesRemaining: number;
  isActive: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  expiresAt: string;
  usedBy?: {
    userId: {
      id: string;
      name: string;
      email: string;
    };
    usedAt: string;
    email: string;
  }[];
  isExpired?: boolean;
  isExhausted?: boolean;
  isAvailable?: boolean;
}

interface CodeStatistics {
  total: number;
  active: number;
  expired: number;
  exhausted: number;
  available: number;
  totalUses: number;
}

export const InvitationCodes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [codes, setCodes] = useState<TemporaryCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCodes, setTotalCodes] = useState(0);
  const [statistics, setStatistics] = useState<CodeStatistics | null>(null);
  const [companies, setCompanies] = useState<{_id: string; name: string; relationship: string}[]>([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [massInviteDialogOpen, setMassInviteDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<TemporaryCode | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    companyId: '',
    role: UserRole.CLIENT_SUPERVISOR,
    description: '',
    maxUses: 1,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    isActive: true
  });
  
  // Other states
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  
  // Mass invitation states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [editableInvitations, setEditableInvitations] = useState<any[]>([]);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [excelProcessing, setExcelProcessing] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  
  // Tab management
  const [activeTab, setActiveTab] = useState(0);
  
  usePageTitle(
    'Códigos de Invitación',
    activeTab === 0 
      ? 'Gestión de códigos de invitación individuales' 
      : 'Seguimiento de invitaciones masivas'
  );
  
  // Table pagination states
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(10);

  // Batches management (Tab 1)
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [batchDetailsOpen, setBatchDetailsOpen] = useState(false);
  const [batchesPage, setBatchesPage] = useState(0);
  const [batchesRowsPerPage, setBatchesRowsPerPage] = useState(10);
  const [batchesTotalCount, setBatchesTotalCount] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

  // Load companies for the supervisor
  const loadCompanies = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/supervised`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Filter companies to get only own and supervised companies (not contractors)
          const supervisionCompanies = result.data.companies.filter((comp: any) => 
            comp.relationship === 'own_company' || comp.relationship === 'supervised_company'
          );
          
          // Remove duplicates based on company ID
          const seenCompanyIds = new Set<string>();
          const uniqueCompanies = supervisionCompanies.filter((comp: any) => {
            if (seenCompanyIds.has(comp._id)) {
              return false;
            }
            seenCompanyIds.add(comp._id);
            return true;
          });
          
          setCompanies(uniqueCompanies);
          if (uniqueCompanies.length > 0 && !formData.companyId) {
            setFormData(prev => ({ ...prev, companyId: uniqueCompanies[0]._id }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, API_BASE_URL]);

  // Load invitation codes
  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString()
      });

      const response = await fetch(`${API_BASE_URL}/temporary-codes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const codesData = Array.isArray(result.data.codes) ? result.data.codes : [];
          setCodes(codesData);
          setTotalCodes(result.data.pagination?.total || codesData.length || 0);
        } else {
          setCodes([]);
          setTotalCodes(0);
        }
      } else {
        setCodes([]);
        setTotalCodes(0);
        throw new Error('Error al cargar los códigos');
      }
    } catch (error) {
      console.error('Error loading codes:', error);
      setCodes([]);
      setTotalCodes(0);
      setSnackbar({
        open: true,
        message: 'Error al cargar los Invitaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, token, API_BASE_URL]);

  // Load batches for Tab 1
  const loadBatches = useCallback(async () => {
    try {
      setBatchesLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/temporary-codes/batches?page=${batchesPage + 1}&limit=${batchesRowsPerPage}&includeStats=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar los lotes');
      }

      const result = await response.json();
      if (result.success) {
        setBatches(result.data.batches || []);
        setBatchesTotalCount(result.data.pagination?.total || 0);
      } else {
        throw new Error(result.message || 'Error al cargar los lotes');
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      setBatches([]);
      setBatchesTotalCount(0);
      setSnackbar({
        open: true,
        message: 'Error al cargar los lotes',
        severity: 'error'
      });
    } finally {
      setBatchesLoading(false);
    }
  }, [batchesPage, batchesRowsPerPage, token, API_BASE_URL]);

  // Load batch details
  const loadBatchDetails = async (batchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/temporary-codes/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles del lote');
      }

      const result = await response.json();
      if (result.success) {
        setSelectedBatch(result.data);
        setBatchDetailsOpen(true);
      } else {
        throw new Error(result.message || 'Error al cargar los detalles');
      }
    } catch (error) {
      console.error('Error loading batch details:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los detalles del lote',
        severity: 'error'
      });
    }
  };

  // Batch control functions
  const handleExecuteBatch = async (batchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/temporary-codes/batches/${batchId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Batch ${batchId} iniciado exitosamente`,
          severity: 'success'
        });
        loadBatches(); // Reload to show updated status
      } else {
        throw new Error(result.message || 'Error al ejecutar el batch');
      }
    } catch (error) {
      console.error('Error executing batch:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al ejecutar el batch',
        severity: 'error'
      });
    }
  };

  const handlePauseBatch = async (batchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/temporary-codes/batches/${batchId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Batch ${batchId} pausado exitosamente`,
          severity: 'success'
        });
        loadBatches();
      } else {
        throw new Error(result.message || 'Error al pausar el batch');
      }
    } catch (error) {
      console.error('Error pausing batch:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al pausar el batch',
        severity: 'error'
      });
    }
  };

  const handleCancelBatch = async (batchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/temporary-codes/batches/${batchId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Batch ${batchId} cancelado exitosamente`,
          severity: 'success'
        });
        loadBatches();
      } else {
        throw new Error(result.message || 'Error al cancelar el batch');
      }
    } catch (error) {
      console.error('Error cancelling batch:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al cancelar el batch',
        severity: 'error'
      });
    }
  };

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/temporary-codes/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatistics(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    if (user?.role === UserRole.CLIENT_SUPERVISOR) {
      loadCompanies();
      loadCodes();
      loadStatistics();
    }
  }, [user, loadCompanies, loadCodes, loadStatistics]);

  // Load batches when switching to Tab 1
  useEffect(() => {
    if (activeTab === 1 && user?.role === UserRole.CLIENT_SUPERVISOR) {
      loadBatches();
    }
  }, [activeTab, loadBatches, user]);

  const handleCreateCode = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/temporary-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          expiresAt: new Date(formData.expiresAt).toISOString()
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSnackbar({
          open: true,
          message: 'Código de invitación creado exitosamente',
          severity: 'success'
        });
        setCreateDialogOpen(false);
        loadCodes();
        loadStatistics();
        // Reset form
        setFormData({
          companyId: companies[0]?._id || '',
          role: UserRole.CLIENT_SUPERVISOR,
          description: '',
          maxUses: 1,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true
        });
      } else {
        throw new Error(result.message || 'Error al crear el código');
      }
    } catch (error) {
      console.error('Error creating code:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al crear el código',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };


  const handleDeleteCode = async () => {
    if (!selectedCode) return;

    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/temporary-codes/${selectedCode.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSnackbar({
          open: true,
          message: 'Código eliminado exitosamente',
          severity: 'success'
        });
        setDeleteDialogOpen(false);
        loadCodes();
        loadStatistics();
      } else {
        throw new Error(result.message || 'Error al eliminar el código');
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al eliminar el código',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Error copying code:', error);
    }
  };

  // Mass invitation handlers
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Excel file selected:', file.name, file.type, file.size);
    setExcelFile(file);
    setExcelProcessing(true);

    try {
      // Read Excel file directly in the frontend using FileReader and basic parsing
      const fileReader = new FileReader();
      
      const readFile = new Promise<any[]>((resolve, reject) => {
        fileReader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            
            // Check if it's a CSV-like file that we can parse more easily
            if (file.name.endsWith('.csv') || file.type === 'text/csv') {
              const text = new TextDecoder('utf-8').decode(data);
              const lines = text.split('\n').filter(line => line.trim());
              
              if (lines.length < 2) {
                throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
              }
              
              const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
              const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const rowData: any = {};
                headers.forEach((header, index) => {
                  rowData[header] = values[index] || '';
                });
                return rowData;
              });
              
              resolve(rows);
            } else {
              // For now, if it's an Excel file, we'll create sample data based on the filename
              // This is a temporary solution until we have a proper Excel parser
              console.log('Excel file detected, using sample data structure');
              
              // Create sample data structure that matches expected Excel format
              const sampleData = [
                {
                  firstName: 'Datos del',
                  lastName: 'Excel cargado',
                  email: 'excel@example.com',
                  phone: '0000-0000',
                  cedula: '000000000',
                  ordenPatronal: 'OP000',
                  polizaINS: 'INS000'
                }
              ];
              
              // Add a note that this is sample data
              setSnackbar({
                open: true,
                message: 'Archivo Excel detectado. Mostrando estructura de ejemplo. Para datos reales, use formato CSV o implemente parser Excel.',
                severity: 'info'
              });
              
              resolve(sampleData);
            }
          } catch (error) {
            reject(error);
          }
        };
        
        fileReader.onerror = () => reject(new Error('Error al leer el archivo'));
        fileReader.readAsArrayBuffer(file);
      });
      
      const parsedData = await readFile;
      console.log('Parsed data:', parsedData);
      
      // Convert to editable format with flexible field mapping
      const editableData = parsedData.map((row: any, index: number) => ({
        id: index,
        firstName: row.firstName || row.nombre || row.Nombre || row['First Name'] || '',
        lastName: row.lastName || row.apellido || row.Apellido || row['Last Name'] || '',
        email: row.email || row.Email || row.correo || row.Correo || '',
        phone: row.phone || row.telefono || row.Telefono || row.Phone || row['Teléfono'] || '',
        cedula: row.cedula || row.Cedula || row.dni || row.DNI || row.identification || row.Identification || '',
        ordenPatronal: row.ordenPatronal || row.orden_patronal || row['Orden Patronal'] || row.OrdenPatronal || '',
        polizaINS: row.polizaINS || row.poliza_ins || row.poliza || row.Poliza || row['Poliza INS'] || row.PolizaINS || '',
        role: UserRole.CLIENT_STAFF,
        companyId: companies[0]?._id || '',
        originalRow: row
      }));
      
      // Filter out completely empty rows
      const validData = editableData.filter((row: any) => 
        row.firstName || row.lastName || row.email
      );
      
      if (validData.length === 0) {
        throw new Error('No se encontraron datos válidos en el archivo. Verifique que tiene datos en las columnas correctas.');
      }
      
      setEditableInvitations(validData);
      setShowDataTable(true);
      
      setSnackbar({
        open: true,
        message: `Archivo procesado exitosamente. ${validData.length} usuarios cargados.`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error processing Excel:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al procesar el archivo Excel',
        severity: 'error'
      });
    } finally {
      setExcelProcessing(false);
    }
  };


  const updateInvitationData = (pageIndex: number, field: string, value: any) => {
    const actualIndex = tablePage * tableRowsPerPage + pageIndex;
    setEditableInvitations(prev => prev.map((invitation, i) => 
      i === actualIndex ? { ...invitation, [field]: value } : invitation
    ));
  };

  const removeInvitationRow = (pageIndex: number) => {
    const actualIndex = tablePage * tableRowsPerPage + pageIndex;
    setEditableInvitations(prev => prev.filter((_, i) => i !== actualIndex));
    
    // Adjust page if we deleted the last item on a page
    const newTotal = editableInvitations.length - 1;
    const maxPage = Math.max(0, Math.ceil(newTotal / tableRowsPerPage) - 1);
    if (tablePage > maxPage) {
      setTablePage(maxPage);
    }
  };

  const resetInvitationDialog = () => {
    console.log('Resetting invitation dialog');
    setExcelFile(null);
    setEditableInvitations([]);
    setShowDataTable(false);
    setExcelProcessing(false);
    setTablePage(0);
    setMassInviteDialogOpen(false);
  };

  // Manual entry functions
  const handleStartManualEntry = () => {
    // Clear any existing data
    setExcelFile(null);
    setEditableInvitations([]);
    
    // Create first empty row
    const emptyRow = {
      index: 0,
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      companyId: '',
      phone: '',
      cedula: '',
      ordenPatronal: '',
      polizaINS: ''
    };
    
    setEditableInvitations([emptyRow]);
    setShowDataTable(true);
    setTablePage(0);
  };

  const handleAddRow = () => {
    const newRow = {
      index: editableInvitations.length,
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      companyId: '',
      phone: '',
      cedula: '',
      ordenPatronal: '',
      polizaINS: ''
    };
    
    setEditableInvitations(prev => [...prev, newRow]);
    
    // Navigate to the page where the new row will be
    const newRowPage = Math.floor(editableInvitations.length / tableRowsPerPage);
    if (newRowPage !== tablePage) {
      setTablePage(newRowPage);
    }
  };

  // Table pagination handlers
  const handleTableChangePage = (_event: unknown, newPage: number) => {
    setTablePage(newPage);
  };

  const handleTableChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTableRowsPerPage(parseInt(event.target.value, 10));
    setTablePage(0);
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = tablePage * tableRowsPerPage;
    const endIndex = startIndex + tableRowsPerPage;
    return editableInvitations.slice(startIndex, endIndex);
  };

  const handleSendInvitations = async () => {
    try {
      setInvitationLoading(true);
      
      // Validate that we have data to send (required fields: firstName, lastName, email, role)
      const validInvitations = editableInvitations.filter(inv => 
        inv.firstName && inv.lastName && inv.email && inv.role && inv.companyId
      );

      if (validInvitations.length === 0) {
        throw new Error('Debe tener al menos una invitación válida con los campos obligatorios completados (Nombre, Apellido, Email, Rol, Espacios de Trabajo)');
      }

      // Show which invitations are invalid for better user feedback
      const invalidInvitations = editableInvitations.filter(inv => 
        !inv.firstName || !inv.lastName || !inv.email || !inv.role || !inv.companyId
      );

      if (invalidInvitations.length > 0) {
        console.warn(`${invalidInvitations.length} invitaciones omitidas por campos faltantes:`, invalidInvitations);
      }

      // Get unique companies for description
      const uniqueCompanies = Array.from(new Set(validInvitations.map(inv => inv.companyId)));
      const companiesCount = uniqueCompanies.length;
      const companiesText = companiesCount === 1 
        ? companies.find(c => c._id === uniqueCompanies[0])?.name || 'empresa'
        : `${companiesCount} empresas`;

      // Send all invitations using the new scheduler endpoint (creates batch)
      const response = await fetch(`${API_BASE_URL}/temporary-codes/batches/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: `Invitación masiva para ${companiesText} - ${new Date().toLocaleDateString()}`,
          sendEmails: true, // Will send emails automatically when executed
          // No scheduledFor = will be executed immediately as draft
          invitations: validInvitations.map(inv => ({
            firstName: inv.firstName,
            lastName: inv.lastName,
            email: inv.email,
            role: inv.role,
            companyId: inv.companyId, // Include companyId for each invitation
            phone: inv.phone,
            cedula: inv.cedula,
            ordenPatronal: inv.ordenPatronal,
            polizaINS: inv.polizaINS
          }))
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al crear el batch de invitaciones');
      }

      // Process results from scheduler batch creation
      const { batchId, totalInvitations, status } = result;
      
      // Generate success message for batch creation
      let message = `Batch creado exitosamente: ${batchId}`;
      if (companiesCount > 1) {
        message += ` para ${companiesCount} empresas`;
      }
      message += `. Total de invitaciones: ${totalInvitations}.`;
      
      // Add status information
      if (status === 'draft') {
        message += ' El batch está en borrador y se puede ejecutar desde la tabla.';
      } else if (status === 'scheduled') {
        message += ' El batch está programado para ejecución automática.';
      }

      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });

      // Show detailed results in console for debugging
      console.log('Batch creation results:', {
        batchId,
        totalInvitations,
        status,
        companiesProcessed: companiesCount,
        description: `Invitación masiva para ${companiesText} - ${new Date().toLocaleDateString()}`
      });

      resetInvitationDialog();
      
      // Reload codes table to show new codes
      loadCodes();
      loadStatistics();
      
      // If we're on the batches tab, reload batches too
      if (activeTab === 1) {
        loadBatches();
      }
      
    } catch (error) {
      console.error('Error creating batch:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al crear el batch de invitaciones',
        severity: 'error'
      });
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batches pagination handlers
  const handleBatchesChangePage = (_event: unknown, newPage: number) => {
    setBatchesPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatchesChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBatchesRowsPerPage(parseInt(event.target.value, 10));
    setBatchesPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<string, string> = {
      [UserRole.CLIENT_SUPERVISOR]: 'Supervisor',
      [UserRole.CLIENT_APPROVER]: 'Verificador',
      [UserRole.CLIENT_STAFF]: 'Interno'
    };
    return roleLabels[role] || role;
  };

  const getCodeStatus = (code: TemporaryCode) => {
    if (!code.isActive) return { label: 'Inactivo', color: 'default' as const };
    if (code.isExpired) return { label: 'Expirado', color: 'error' as const };
    if (code.isExhausted) return { label: 'Agotado', color: 'warning' as const };
    if (code.isAvailable) return { label: 'Disponible', color: 'success' as const };
    return { label: 'No disponible', color: 'default' as const };
  };

  if (user?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/company-users');
          }}
        >
          Usuarios
        </Link>
        <Typography color="textPrimary">
          Invitaciones
        </Typography>
      </Breadcrumbs>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            Invitaciones
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Administre los códigos temporales para el registro de usuarios
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Botón condicional según el tab activo */}
          {activeTab === 0 ? (
            <Button
              variant="contained"
              startIcon={!isXs && <CodeIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isXs}
            >
              {isXs ? 'Crear' : 'Crear Código'}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={!isXs && <EmailIcon />}
              onClick={() => setMassInviteDialogOpen(true)}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isXs}
            >
              {isXs ? 'Crear Batch' : 'Crear Batch Masivo'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Invitación por Código" />
          <Tab label="Invitaciones Masivas" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Tab 0: Invitación por Código */}
          {/* Statistics */}
          {statistics && (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"}>{statistics.total}</Typography>
                    <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                      Total Códigos
                    </Typography>
                  </Box>
                  <CodeIcon color="primary" sx={{ fontSize: isMobile ? 24 : 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"}>{statistics.available}</Typography>
                    <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                      Disponibles
                    </Typography>
                  </Box>
                  <CheckIcon color="success" sx={{ fontSize: isMobile ? 24 : 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"}>{statistics.expired}</Typography>
                    <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                      Expirados
                    </Typography>
                  </Box>
                  <ScheduleIcon color="error" sx={{ fontSize: isMobile ? 24 : 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"}>{statistics.exhausted}</Typography>
                    <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                      Agotados
                    </Typography>
                  </Box>
                  <BlockIcon color="warning" sx={{ fontSize: isMobile ? 24 : 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "h5" : "h4"}>{statistics.totalUses}</Typography>
                    <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                      Usos Totales
                    </Typography>
                  </Box>
                  <GroupIcon color="info" sx={{ fontSize: isMobile ? 24 : 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Codes Table/Cards */}
      <Card>
        {loading ? (
          <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={rowsPerPage} />
        ) : !Array.isArray(codes) || codes.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No hay Invitaciones
            </Typography>
          </Box>
        ) : isMobile ? (
          // Mobile Cards View
          <Box sx={{ p: 2 }}>
            {codes.map((code) => {
              const status = getCodeStatus(code);
              return (
                <Card key={code.id} sx={{ mb: 2, boxShadow: 1 }}>
                  <CardContent>
                    {/* Header with Code and Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium" fontFamily="monospace">
                            {code.code}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(code.code)}
                          >
                            {copiedCode === code.code ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                        <Chip
                          label={status.label}
                          size="small"
                          color={status.color}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedCode(code);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    {/* Company and Role */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Espacios de Trabajo
                      </Typography>
                      <Typography variant="body1">
                        {code.company.name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Rol
                        </Typography>
                        <Chip
                          label={getRoleLabel(code.role)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          Usos
                        </Typography>
                        <Typography variant="body1">
                          {code.currentUses} / {code.maxUses}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Expiration and Creator */}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Expira
                        </Typography>
                        <Typography variant="body2">
                          {format(new Date(code.expiresAt), 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          Creado por
                        </Typography>
                        <Typography variant="body2">
                          {code.createdBy.name}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          // Desktop Table View
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Espacios de Trabajo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Usos</TableCell>
                  <TableCell>Expira</TableCell>
                  <TableCell>Creado por</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {codes.map((code) => {
                  const status = getCodeStatus(code);
                  return (
                    <TableRow key={code.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium" fontFamily="monospace">
                            {code.code}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(code.code)}
                          >
                            {copiedCode === code.code ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>{code.company.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(code.role)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          color={status.color}
                        />
                      </TableCell>
                      <TableCell>
                        {code.currentUses} / {code.maxUses}
                      </TableCell>
                      <TableCell>
                        {format(new Date(code.expiresAt), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {code.createdBy.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(code.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedCode(code);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCodes}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
          </Card>
        </>
      )}

      {activeTab === 1 && (
        <>
          {/* Tab 1: Invitaciones Masivas */}
          <Card>
            {batchesLoading ? (
              <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={batchesRowsPerPage} />
            ) : (
              <>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"}>
                      Lotes de Invitaciones Masivas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {batchesTotalCount} lote{batchesTotalCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: { xs: 'none', sm: 'block' } }}>
                    Historial y seguimiento de todas las operaciones masivas de invitación.
                  </Typography>
                </CardContent>
                
                {batches.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary">
                      No hay lotes de invitaciones masivas
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cree su primer lote usando el botón "Crear Batch Masivo"
                    </Typography>
                  </Box>
                ) : isMobile ? (
                  // Mobile Cards View
                  <Box sx={{ p: 2 }}>
                    {batches.map((batch) => {
                      const getBatchStatusColor = (status: string) => {
                        switch(status) {
                          case 'scheduled': return 'info';
                          case 'running': return 'warning';
                          case 'completed': return 'success';
                          case 'paused': return 'default';
                          case 'cancelled': return 'error';
                          case 'failed': return 'error';
                          default: return 'default';
                        }
                      };

                      const getBatchStatusLabel = (status: string) => {
                        switch(status) {
                          case 'scheduled': return 'Programado';
                          case 'running': return 'Ejecutándose';
                          case 'completed': return 'Completado';
                          case 'paused': return 'Pausado';
                          case 'cancelled': return 'Cancelado';
                          case 'failed': return 'Fallido';
                          case 'draft': return 'Borrador';
                          default: return status || 'Desconocido';
                        }
                      };
                      
                      return (
                        <Card key={batch.id} sx={{ mb: 2, boxShadow: 1 }}>
                          <CardContent>
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="medium" fontFamily="monospace">
                                  {batch.batchId}
                                </Typography>
                                <Chip 
                                  label={getBatchStatusLabel(batch.batchStatus || batch.status)}
                                  color={getBatchStatusColor(batch.batchStatus || batch.status)}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setBatchDetailsOpen(true);
                                  loadBatchDetails(batch.id);
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Box>
                            
                            {/* Description */}
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {batch.description || 'Sin descripción'}
                            </Typography>
                            
                            {/* Stats */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Total
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {batch.totalInvitations || batch.statistics?.totalInvitations || 0}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Progreso
                                </Typography>
                                <Typography variant="body1">
                                  {batch.statistics?.successfulCodes || 0}/{batch.totalInvitations || 0}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Emails
                                </Typography>
                                <Typography variant="body1">
                                  {batch.emailStatus?.sent || 0}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Footer Info */}
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Creado por
                                </Typography>
                                <Typography variant="body2">
                                  {batch.createdBy?.name || 'Desconocido'}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Fecha
                                </Typography>
                                <Typography variant="body2">
                                  {new Date(batch.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                              {(batch.batchStatus === 'scheduled' || batch.batchStatus === 'draft' || batch.batchStatus === 'paused' || batch.status === 'scheduled' || batch.status === 'draft' || batch.status === 'paused') && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<PlayIcon />}
                                  onClick={() => handleExecuteBatch(batch.batchId)}
                                >
                                  Ejecutar
                                </Button>
                              )}
                              
                              {(batch.batchStatus === 'running' || batch.status === 'running') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PauseIcon />}
                                  onClick={() => handlePauseBatch(batch.batchId)}
                                >
                                  Pausar
                                </Button>
                              )}
                              
                              {(batch.batchStatus === 'scheduled' || batch.status === 'scheduled') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<StopIcon />}
                                  onClick={() => handleCancelBatch(batch.batchId)}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                ) : (
                  // Desktop Table View
                  <TableContainer component={Paper}>
                    <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch ID</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Estado Batch</TableCell>
                    <TableCell align="center">Programado para</TableCell>
                    <TableCell>Creado por</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Progreso</TableCell>
                    <TableCell align="center">Emails</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell align="center">Controles</TableCell>
                    <TableCell align="center">Ver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchesLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <Box sx={{ py: 4 }}>
                          <CircularProgress sx={{ mb: 2 }} />
                          <Typography variant="body1">
                            Cargando lotes...
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <Box sx={{ py: 4 }}>
                          <Typography variant="h6" color="textSecondary">
                            No hay lotes de invitaciones masivas
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Cree su primer lote usando el botón "Invitar Usuarios"
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => {
                      const getBatchStatusColor = (status: string) => {
                        switch(status) {
                          case 'scheduled': return 'info';
                          case 'running': return 'warning';
                          case 'completed': return 'success';
                          case 'paused': return 'default';
                          case 'cancelled': return 'error';
                          case 'failed': return 'error';
                          default: return 'default';
                        }
                      };

                      const getBatchStatusLabel = (status: string) => {
                        switch(status) {
                          case 'scheduled': return 'Programado';
                          case 'running': return 'Ejecutándose';
                          case 'completed': return 'Completado';
                          case 'paused': return 'Pausado';
                          case 'cancelled': return 'Cancelado';
                          case 'failed': return 'Fallido';
                          case 'draft': return 'Borrador';
                          default: return status || 'Desconocido';
                        }
                      };

                      return (
                        <TableRow key={batch.id} hover>
                          {/* Batch ID */}
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" fontFamily="monospace">
                              {batch.batchId}
                            </Typography>
                          </TableCell>
                          
                          {/* Descripción */}
                          <TableCell>
                            <Typography variant="body2">
                              {batch.description || 'Sin descripción'}
                            </Typography>
                          </TableCell>
                          
                          {/* Estado Batch */}
                          <TableCell>
                            <Chip 
                              label={getBatchStatusLabel(batch.batchStatus || batch.status)}
                              color={getBatchStatusColor(batch.batchStatus || batch.status)}
                              size="small"
                            />
                          </TableCell>
                          
                          {/* Programado para */}
                          <TableCell align="center">
                            {batch.scheduledFor ? (
                              <Box>
                                <Typography variant="caption">
                                  {new Date(batch.scheduledFor).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {new Date(batch.scheduledFor).toLocaleTimeString()}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                Inmediato
                              </Typography>
                            )}
                          </TableCell>
                          
                          {/* Creado por */}
                          <TableCell>
                            <Typography variant="body2">
                              {batch.createdBy?.name || 'Usuario desconocido'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {batch.createdBy?.email}
                            </Typography>
                          </TableCell>
                          
                          {/* Total */}
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="medium">
                              {batch.totalInvitations || batch.statistics?.totalInvitations || 0}
                            </Typography>
                          </TableCell>
                          
                          {/* Progreso */}
                          <TableCell align="center">
                            <Box>
                              <Typography variant="body2">
                                {batch.statistics?.successfulCodes || 0}/{batch.totalInvitations || batch.statistics?.totalInvitations || 0}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {batch.statistics?.usersRegistered || 0} registrados
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          {/* Emails */}
                          <TableCell align="center">
                            <Typography variant="body2">
                              {batch.emailStatus?.sent || 0}
                            </Typography>
                            {batch.emailStatus?.failed > 0 && (
                              <Typography variant="caption" color="error">
                                ({batch.emailStatus.failed} fallidos)
                              </Typography>
                            )}
                          </TableCell>
                          
                          {/* Fecha Creación */}
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(batch.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(batch.createdAt).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          
                          {/* Controles */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', minWidth: '100px' }}>
                              {(batch.batchStatus === 'scheduled' || batch.batchStatus === 'draft' || batch.batchStatus === 'paused' || batch.status === 'scheduled' || batch.status === 'draft' || batch.status === 'paused') && (
                                <Tooltip title="Ejecutar">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleExecuteBatch(batch.batchId)}
                                  >
                                    <PlayIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {(batch.batchStatus === 'running' || batch.status === 'running') && (
                                <Tooltip title="Pausar">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handlePauseBatch(batch.batchId)}
                                  >
                                    <PauseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {(batch.batchStatus === 'scheduled' || batch.batchStatus === 'draft' || batch.batchStatus === 'paused' || batch.batchStatus === 'running' || batch.status === 'scheduled' || batch.status === 'draft' || batch.status === 'paused' || batch.status === 'running') && (
                                <Tooltip title="Cancelar">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleCancelBatch(batch.batchId)}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {/* Show placeholder text when no controls available */}
                              {!(batch.batchStatus === 'scheduled' || batch.batchStatus === 'draft' || batch.batchStatus === 'paused' || batch.batchStatus === 'running' || batch.status === 'scheduled' || batch.status === 'draft' || batch.status === 'paused' || batch.status === 'running') && (
                                <Typography variant="caption" color="textSecondary">
                                  -
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          
                          {/* Ver */}
                          <TableCell align="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => loadBatchDetails(batch.batchId)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          </>
        )}
      </Card>
      
      {batches.length > 0 && !batchesLoading && (
        <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={batchesTotalCount}
              rowsPerPage={batchesRowsPerPage}
              page={batchesPage}
              onPageChange={handleBatchesChangePage}
              onRowsPerPageChange={handleBatchesChangeRowsPerPage}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '95%', sm: '600px' },
            m: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle>Crear Código de Invitación</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Espacios de Trabajo</InputLabel>
              <Select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                label="Espacios de Trabajo"
              >
                {companies.map((company) => (
                  <MenuItem key={company._id} value={company._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{company.name}</Typography>
                      <Chip 
                        label={company.relationship === 'own_company' ? 'Propia' : 'Supervisada'} 
                        size="small" 
                        sx={{ ml: 1 }}
                        color={company.relationship === 'own_company' ? 'primary' : 'secondary'}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                label="Rol"
              >
                <MenuItem value={UserRole.CLIENT_SUPERVISOR}>Supervisor</MenuItem>
                <MenuItem value={UserRole.CLIENT_APPROVER}>Verificador</MenuItem>
                <MenuItem value={UserRole.CLIENT_STAFF}>Interno</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Máximo de usos"
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
              slotProps={{
                htmlInput: { min: 1 }
              }}
            />

            <TextField
              fullWidth
              label="Fecha de expiración"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateCode} variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Creando...' : 'Crear Código'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Mass Invitation Dialog */}
      <Dialog 
        open={massInviteDialogOpen} 
        onClose={resetInvitationDialog} 
        maxWidth="lg" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '100%', sm: '90%', md: '80%' },
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' },
            height: { xs: '100vh', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          Invitar Usuarios Masivamente
          {showDataTable && (
            <Typography variant="body2" color="text.secondary">
              {editableInvitations.length} usuarios cargados desde Excel
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {!showDataTable ? (
            // Step 1: Upload Excel
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Paso 1:</strong> Sube un archivo CSV o Excel con las siguientes columnas:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                  <li><strong>firstName</strong> - Nombre del usuario</li>
                  <li><strong>lastName</strong> - Apellido del usuario</li>
                  <li><strong>email</strong> - Correo electrónico</li>
                  <li><strong>phone</strong> - Número de teléfono</li>
                  <li><strong>cedula</strong> - Número de identificación</li>
                  <li><strong>ordenPatronal</strong> - Orden patronal</li>
                  <li><strong>polizaINS</strong> - Póliza INS</li>
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  <strong>Recomendado:</strong> Use formato CSV para mejor compatibilidad. 
                  El rol y la empresa se asignarán en el siguiente paso.
                </Typography>
              </Alert>
              
              <input
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                id="excel-file-upload"
                type="file"
                onChange={handleExcelUpload}
                disabled={excelProcessing}
                key={excelFile ? excelFile.name : 'excel-input'}
              />
              <label htmlFor="excel-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={excelProcessing ? <CircularProgress size={20} /> : <UploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                  disabled={excelProcessing}
                >
                  {excelProcessing ? 'Procesando archivo...' : 'Seleccionar archivo CSV/Excel'}
                </Button>
              </label>
              
              {excelFile && !excelProcessing && (
                <Alert severity="success">
                  Archivo seleccionado: {excelFile.name}
                </Alert>
              )}

              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  O crear invitaciones manualmente
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Button
                    variant="contained"
                    startIcon={!isXs && <PersonAddIcon />}
                    onClick={handleStartManualEntry}
                    disabled={excelProcessing || invitationLoading}
                    fullWidth={isMobile}
                    size={isMobile ? "medium" : "large"}
                  >
                    {isXs && <PersonAddIcon sx={{ mr: 1 }} />}
                    Empezar desde cero
                  </Button>
                  {editableInvitations.length > 0 && (
                    <Button
                      variant="outlined"
                      startIcon={!isXs && <AddIcon />}
                      onClick={handleAddRow}
                      disabled={excelProcessing || invitationLoading}
                      fullWidth={isMobile}
                      size={isMobile ? "medium" : "large"}
                    >
                      {isXs && <AddIcon sx={{ mr: 1 }} />}
                      Agregar fila
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            // Step 2: Review and Edit Data
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Paso 2:</strong> Revisa y ajusta la información antes de enviar las invitaciones. 
                  Puedes editar cualquier campo directamente en la tabla.
                </Typography>
              </Alert>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Campos obligatorios:</strong> Nombre, Apellido, Email, Rol, Espacios de Trabajo <span style={{ color: 'red' }}>*</span>
                  <br />
                  <strong>Campos opcionales:</strong> Teléfono, Cédula, Orden Patronal, Póliza INS
                </Typography>
              </Alert>

              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1 
                }}>
                  <Button
                    variant="outlined"
                    startIcon={!isXs && <AddIcon />}
                    onClick={handleAddRow}
                    disabled={invitationLoading}
                    size={isMobile ? "medium" : "small"}
                    fullWidth={isXs}
                  >
                    {isXs && <AddIcon sx={{ mr: 1 }} />}
                    Agregar fila
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setEditableInvitations([]);
                      setShowDataTable(false);
                      setExcelFile(null);
                      setTablePage(0);
                    }}
                    disabled={invitationLoading}
                    size={isMobile ? "medium" : "small"}
                    fullWidth={isXs}
                  >
                    Limpiar todo
                  </Button>
                </Box>
                <Typography 
                  variant={isXs ? "body2" : "caption"} 
                  color="textSecondary"
                  sx={{ textAlign: { xs: 'center', sm: 'right' } }}
                >
                  Total: {editableInvitations.length} invitación{editableInvitations.length !== 1 ? 'es' : ''}
                </Typography>
              </Box>
              
              {isMobile ? (
                // Mobile Cards View for Editable Invitations
                <Box sx={{ maxHeight: { xs: '60vh', sm: 500 }, overflow: 'auto', mb: 2 }}>
                  {getCurrentPageData().map((invitation, index) => (
                    <Card key={invitation.id} sx={{ mb: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          Invitación {(tablePage * tableRowsPerPage) + index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeInvitationRow(index)}
                          disabled={editableInvitations.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      {/* Required Fields */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Campos Obligatorios *
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Nombre *"
                            value={invitation.firstName}
                            onChange={(e) => updateInvitationData(index, 'firstName', e.target.value)}
                            size="small"
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Apellido *"
                            value={invitation.lastName}
                            onChange={(e) => updateInvitationData(index, 'lastName', e.target.value)}
                            size="small"
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Email *"
                            value={invitation.email}
                            onChange={(e) => updateInvitationData(index, 'email', e.target.value)}
                            size="small"
                            type="email"
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>Rol *</InputLabel>
                            <Select
                              value={invitation.role}
                              label="Rol *"
                              onChange={(e) => updateInvitationData(index, 'role', e.target.value)}
                            >
                              <MenuItem value={UserRole.CLIENT_SUPERVISOR}>Supervisor</MenuItem>
                              <MenuItem value={UserRole.CLIENT_APPROVER}>Verificador</MenuItem>
                              <MenuItem value={UserRole.CLIENT_STAFF}>Interno</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>Espacios de Trabajo *</InputLabel>
                            <Select
                              value={invitation.companyId}
                              label="Espacios de Trabajo *"
                              onChange={(e) => updateInvitationData(index, 'companyId', e.target.value)}
                            >
                              {companies.map((company) => (
                                <MenuItem key={company._id} value={company._id}>
                                  {company.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      
                      {/* Optional Fields */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Campos Opcionales
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Teléfono"
                            value={invitation.phone}
                            onChange={(e) => updateInvitationData(index, 'phone', e.target.value)}
                            size="small"
                            type="tel"
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Cédula"
                            value={invitation.cedula}
                            onChange={(e) => updateInvitationData(index, 'cedula', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Orden Patronal"
                            value={invitation.ordenPatronal}
                            onChange={(e) => updateInvitationData(index, 'ordenPatronal', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Póliza INS"
                            value={invitation.polizaINS}
                            onChange={(e) => updateInvitationData(index, 'polizaINS', e.target.value)}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Box>
              ) : (
                // Desktop Table View
                <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Nombre <span style={{ color: 'red' }}>*</span>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Apellido <span style={{ color: 'red' }}>*</span>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Email <span style={{ color: 'red' }}>*</span>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Teléfono</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Cédula</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Orden Patronal</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Póliza INS</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Rol <span style={{ color: 'red' }}>*</span>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Espacios de Trabajo <span style={{ color: 'red' }}>*</span>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 80 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentPageData().map((invitation, index) => (
                      <TableRow key={invitation.id} hover>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.firstName}
                            onChange={(e) => updateInvitationData(index, 'firstName', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.lastName}
                            onChange={(e) => updateInvitationData(index, 'lastName', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.email}
                            onChange={(e) => updateInvitationData(index, 'email', e.target.value)}
                            size="small"
                            variant="standard"
                            type="email"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.phone}
                            onChange={(e) => updateInvitationData(index, 'phone', e.target.value)}
                            size="small"
                            variant="standard"
                            type="tel"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.cedula}
                            onChange={(e) => updateInvitationData(index, 'cedula', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.ordenPatronal}
                            onChange={(e) => updateInvitationData(index, 'ordenPatronal', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={invitation.polizaINS}
                            onChange={(e) => updateInvitationData(index, 'polizaINS', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={invitation.role}
                              onChange={(e) => updateInvitationData(index, 'role', e.target.value)}
                            >
                              <MenuItem value={UserRole.CLIENT_SUPERVISOR}>Supervisor</MenuItem>
                              <MenuItem value={UserRole.CLIENT_APPROVER}>Verificador</MenuItem>
                              <MenuItem value={UserRole.CLIENT_STAFF}>Interno</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={invitation.companyId}
                              onChange={(e) => updateInvitationData(index, 'companyId', e.target.value)}
                            >
                              {companies.map((company) => (
                                <MenuItem key={company._id} value={company._id}>
                                  {company.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeInvitationRow(index)}
                            disabled={editableInvitations.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              )}
              
              {/* Table Pagination */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={editableInvitations.length}
                rowsPerPage={tableRowsPerPage}
                page={tablePage}
                onPageChange={handleTableChangePage}
                onRowsPerPageChange={handleTableChangeRowsPerPage}
                labelRowsPerPage="Filas por página"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
              
              {/* Summary before sending */}
              {showDataTable && editableInvitations.length > 0 && (() => {
                const validInvitations = editableInvitations.filter(inv => 
                  inv.firstName && inv.lastName && inv.email && inv.role && inv.companyId
                );
                const invalidCount = editableInvitations.length - validInvitations.length;
                
                return (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📋 Resumen de invitaciones a enviar:
                    </Typography>
                    <Typography variant="body2" sx={{ color: validInvitations.length > 0 ? 'success.main' : 'error.main' }}>
                      • <strong>{validInvitations.length}</strong> invitaciones válidas 
                      {invalidCount > 0 && (
                        <span style={{ color: '#ed6c02' }}> ({invalidCount} omitidas por campos faltantes)</span>
                      )}
                    </Typography>
                    {validInvitations.length > 0 && (() => {
                      // Group invitations by company to show company breakdown
                      const companiesInInvitations = Array.from(new Set(validInvitations.map(inv => inv.companyId)));
                      const companyBreakdown = companiesInInvitations.map(companyId => {
                        const companyName = companies.find(c => c._id === companyId)?.name || 'Sin empresa';
                        const count = validInvitations.filter(inv => inv.companyId === companyId).length;
                        return `${companyName} (${count})`;
                      }).join(', ');
                      
                      return (
                        <>
                          <Typography variant="body2">
                            • <strong>Espacios de Trabajos:</strong> {companyBreakdown}
                          </Typography>
                          <Typography variant="body2">
                            • <strong>Roles:</strong> {Array.from(new Set(validInvitations.map(inv => getRoleLabel(inv.role)))).join(', ')}
                          </Typography>
                        </>
                      );
                    })()}
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                      Se enviarán emails automáticamente con códigos únicos de invitación
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 },
          '& > :not(style)': { 
            m: { xs: 0, sm: 1 },
            width: { xs: '100%', sm: 'auto' }
          }
        }}>
          <Button 
            onClick={resetInvitationDialog}
            size={isMobile ? "medium" : "small"}
            fullWidth={isMobile}
          >
            Cancelar
          </Button>
          {showDataTable && (
            <Button 
              onClick={() => setShowDataTable(false)}
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              fullWidth={isMobile}
            >
              {isMobile ? 'Cambiar' : 'CAMBIAR ARCHIVO'}
            </Button>
          )}
          <Button 
            onClick={handleSendInvitations} 
            variant="contained" 
            disabled={invitationLoading || !showDataTable || editableInvitations.length === 0}
            startIcon={!isXs && <EmailIcon />}
            size={isMobile ? "medium" : "small"}
            fullWidth={isMobile}
          >
            {isXs && <EmailIcon sx={{ mr: 1 }} />}
            {invitationLoading ? 'Enviando...' : isXs ? `Enviar (${editableInvitations.length})` : `Enviar ${editableInvitations.length} Invitaciones`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar Código de Invitación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el código "{selectedCode?.code}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteCode} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Batch Details Dialog */}
      <Dialog
        open={batchDetailsOpen}
        onClose={() => setBatchDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '100%', sm: '90%' },
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>
          Detalles del Lote: {selectedBatch?.batch?.batchId}
        </DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <Box sx={{ mt: 2 }}>
              {/* Batch Summary */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen del Lote
                  </Typography>
                  <Grid container spacing={{ xs: 1, sm: 2 }}>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="primary">
                          {selectedBatch.summary?.total || 0}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Total Códigos
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
                          {selectedBatch.summary?.used || 0}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Usados
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="info.main">
                          {selectedBatch.summary?.emailsSent || 0}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Emails Enviados
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant={isMobile ? "h5" : "h4"} color="warning.main">
                          {selectedBatch.summary?.expired || 0}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Expirados
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* By Company */}
              {selectedBatch.summary?.byCompany && Object.keys(selectedBatch.summary.byCompany).length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Por Espacios de Trabajo
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(selectedBatch.summary.byCompany).map(([companyName, stats]: [string, any]) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={companyName}>
                          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {companyName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total: {stats.total} | Usados: {stats.used} | Emails: {stats.sent}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Codes Preview */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Códigos Detallados (Primeros 10)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Espacios de Trabajo</TableCell>
                          <TableCell>Usuario Invitado</TableCell>
                          <TableCell align="center">Estado</TableCell>
                          <TableCell align="center">Usado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedBatch.detailedCodes || []).slice(0, 10).map((code: any) => (
                          <TableRow key={code.id}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {code.code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {code.company}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {code.invitedUser?.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {code.invitedUser?.email}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={code.status?.isExpired ? 'Expirado' : code.status?.isActive ? 'Activo' : 'Inactivo'}
                                color={code.status?.isExpired ? 'error' : code.status?.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {code.status?.isUsed ? (
                                <Chip label="Sí" color="success" size="small" />
                              ) : (
                                <Chip label="No" color="default" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {(selectedBatch.detailedCodes || []).length > 10 && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Mostrando primeros 10 de {selectedBatch.detailedCodes.length} códigos totales
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDetailsOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </>
  );
};