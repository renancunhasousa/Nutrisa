import { createContext, useContext } from 'react';
export const AvaliacaoContext = createContext(null);
export function useAvaliacaoContext() {
 const value = useContext(AvaliacaoContext);
 if (!value) throw new Error('A avaliação precisa de um provider.');
 return value;
}
