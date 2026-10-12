import { createContext, useContext } from 'react';

export const PatientStateContext = createContext(null);

export function usePatient() {
  const context = useContext(PatientStateContext);
  if (!context) throw new Error('usePatient precisa estar dentro de PatientProvider.');
  return context;
}
