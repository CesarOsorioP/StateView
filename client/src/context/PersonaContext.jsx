import React, { createContext, useContext, useState } from 'react';
import api from '../api/api';

const PersonaContext = createContext();

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona debe ser usado dentro de un PersonaProvider');
  }
  return context;
};

export const PersonaProvider = ({ children }) => {
  const [persona, setPersona] = useState(null);

  const getPersonaById = async (id) => {
    try {
      const response = await api.get(`/api/persona/${id}`);
      setPersona(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener persona:', error);
      throw error;
    }
  };

  const updatePersona = async (id, data) => {
    try {
      const response = await api.put(`/api/persona/${id}`, data);
      setPersona(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar persona:', error);
      throw error;
    }
  };

  const getPersonaBadges = async (id) => {
    try {
      const response = await api.get(`/api/persona/${id}/badges`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener insignias:', error);
      return [];
    }
  };

  return (
    <PersonaContext.Provider value={{
      persona,
      getPersonaById,
      updatePersona,
      getPersonaBadges
    }}>
      {children}
    </PersonaContext.Provider>
  );
}; 