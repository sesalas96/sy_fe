import { useState, useEffect, useCallback } from 'react';
import { fileService } from '../services/fileService';
import { useAuth } from '../contexts/AuthContext';

interface ContractorFile {
  id: string; // Cambiado de _id a id según la respuesta del backend
  filename: string;
  originalName: string;
  fieldName: string; // selfie, idFront, idBack, polizaINS, etc.
  documentType: string; // identity, legal, medical, course
  size: number;
  uploadDate: string;
  downloadUrl: string;
}

interface ContractorFilesData {
  files: ContractorFile[];
  selfieUrl?: string;
  identityFiles: ContractorFile[];
  legalFiles: ContractorFile[];
  medicalFiles: ContractorFile[];
  courseFiles: ContractorFile[];
}

export const useContractorFiles = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filesData, setFilesData] = useState<ContractorFilesData>({
    files: [],
    identityFiles: [],
    legalFiles: [],
    medicalFiles: [],
    courseFiles: []
  });

  const fetchFiles = useCallback(async () => {
    console.log('Full user object:', user);
    
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }
    
    // Usar id o _id, lo que esté disponible  
    const userId = user.id || user._id;
    if (!userId) {
      console.error('User object missing id and _id fields:', user);
      setError('Error: ID de usuario no disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching files for user:', userId, 'role:', user.role);
      
      // Intentar obtener archivos del usuario
      let response;
      try {
        response = await fileService.getContractorFiles(userId);
        console.log('Files response:', response);
      } catch (err: any) {
        console.error('Error fetching files:', err);
        console.error('Error details:', err.response?.data);
        
        // Si es un error 404, significa que no hay archivos (normal)
        if (err.response?.status === 404) {
          console.log('No files found for user - this is normal');
          setFilesData({
            files: [],
            identityFiles: [],
            legalFiles: [],
            medicalFiles: [],
            courseFiles: []
          });
          setError(null);
          setLoading(false);
          return;
        }
        
        // Para error 500, mostrar un mensaje más amigable
        if (err.response?.status === 500) {
          console.log('Backend error - probably user not found as contractor');
          setFilesData({
            files: [],
            identityFiles: [],
            legalFiles: [],
            medicalFiles: [],
            courseFiles: []
          });
          setError('Usuario aún no tiene archivos subidos');
          setLoading(false);
          return;
        }
        
        // Para otros errores
        setError(err.response?.data?.error?.message || err.message || 'Error al cargar archivos');
        setLoading(false);
        return;
      }
      
      if (response.success && response.files) {
        const files: ContractorFile[] = response.files;
        console.log('Processing', files.length, 'files:', files.map(f => ({ id: f.id, fieldName: f.fieldName, documentType: f.documentType })));
        
        // Separar archivos por documentType y fieldName
        const identityFiles = files.filter(f => f.documentType === 'identity' || ['selfie', 'idFront', 'idBack'].includes(f.fieldName));
        const legalFiles = files.filter(f => f.documentType === 'legal' || ['polizaINS', 'ordenPatronal', 'contractorLicense', 'backgroundCheck'].includes(f.fieldName));
        const medicalFiles = files.filter(f => f.documentType === 'medical' || f.fieldName === 'medicalCertificate');
        const courseFiles = files.filter(f => f.documentType === 'course' || ['initialCourses', 'additionalCourses'].includes(f.fieldName));
        
        console.log('Files categorized:', {
          identity: identityFiles.length,
          legal: legalFiles.length, 
          medical: medicalFiles.length,
          course: courseFiles.length
        });
        
        // Buscar el selfie para el avatar
        const selfieFile = files.find(f => f.fieldName === 'selfie');
        let selfieUrl = undefined;
        
        if (selfieFile) {
          try {
            console.log('Downloading selfie for avatar:', selfieFile.id);
            // Crear URL del blob para el selfie usando el id correcto
            const blob = await fileService.downloadContractorFile(selfieFile.id);
            selfieUrl = URL.createObjectURL(blob);
            console.log('Selfie URL created successfully');
          } catch (err) {
            console.error('Error downloading selfie:', err);
          }
        } else {
          console.log('No selfie file found in files:', files.map(f => f.fieldName));
        }

        const finalFilesData = {
          files,
          selfieUrl,
          identityFiles,
          legalFiles,
          medicalFiles,
          courseFiles
        };
        
        console.log('Final filesData set:', {
          totalFiles: finalFilesData.files.length,
          hasSelfieUrl: !!finalFilesData.selfieUrl,
          categoryCounts: {
            identity: finalFilesData.identityFiles.length,
            legal: finalFilesData.legalFiles.length,
            medical: finalFilesData.medicalFiles.length,
            course: finalFilesData.courseFiles.length
          }
        });
        
        setFilesData(finalFilesData);
      } else {
        setError(response.message || 'Error al obtener archivos');
      }
    } catch (err: any) {
      console.error('Error fetching contractor files:', err);
      setError(err.response?.data?.message || 'Error al cargar los archivos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const downloadFile = async (fileId: string, originalName: string) => {
    try {
      console.log('Downloading file with ID:', fileId, 'name:', originalName);
      
      const blob = await fileService.downloadContractorFile(fileId);
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      console.error('Error details:', err.response?.data);
      throw new Error(`Error al descargar el archivo: ${err.response?.data?.error || err.message}`);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fileService.deleteContractorFile(fileId);
      if (response.success) {
        // Recargar archivos después de eliminar
        await fetchFiles();
      } else {
        throw new Error(response.message || 'Error al eliminar archivo');
      }
    } catch (err: any) {
      console.error('Error deleting file:', err);
      throw new Error('Error al eliminar el archivo');
    }
  };

  // Limpiar URLs del blob cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (filesData.selfieUrl) {
        URL.revokeObjectURL(filesData.selfieUrl);
      }
    };
  }, [filesData.selfieUrl]);

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id, fetchFiles]);

  return {
    loading,
    error,
    filesData,
    fetchFiles,
    downloadFile,
    deleteFile,
    refetch: fetchFiles
  };
};