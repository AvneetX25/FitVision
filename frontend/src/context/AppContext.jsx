import React, { createContext, useContext, useReducer } from 'react';
import { workoutReducer, initialState } from '../store/workoutStore';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [workoutState, dispatch] = useReducer(workoutReducer, initialState);

  return (
    <AppContext.Provider value={{ workoutState, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}