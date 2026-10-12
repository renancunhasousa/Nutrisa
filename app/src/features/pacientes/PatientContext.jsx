import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { listPatients } from './services/patients.js';
import { PatientStateContext } from './usePatient.js';
const SELECTED_PATIENT_KEY = 'nutrisa_selected_patient_id';

export function PatientProvider({ children }) {
  const { organizationId } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(() => localStorage.getItem(SELECTED_PATIENT_KEY) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshPatients = useCallback(async () => {
    if (!organizationId) return [];
    setLoading(true);
    setError('');
    try {
      const data = await listPatients(organizationId);
      setPatients(data);
      return data;
    } catch (requestError) {
      setError(requestError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { refreshPatients(); }, [refreshPatients]);

  useEffect(() => {
    if (selectedPatientId) localStorage.setItem(SELECTED_PATIENT_KEY, selectedPatientId);
    else localStorage.removeItem(SELECTED_PATIENT_KEY);
  }, [selectedPatientId]);

  useEffect(() => {
    if (selectedPatientId && patients.length && !patients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId('');
    }
  }, [patients, selectedPatientId]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;
  const value = useMemo(() => ({
    patients,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    selectPatient: (patient) => setSelectedPatientId(patient?.id || ''),
    refreshPatients,
    loading,
    error,
  }), [patients, selectedPatient, selectedPatientId, refreshPatients, loading, error]);

  return <PatientStateContext.Provider value={value}>{children}</PatientStateContext.Provider>;
}
