import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const RendezVousModal = ({ affaire, rendezVous = null, isEdit = false, onClose, onSave, isOpen }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    type_rendez_vous: 'AUDIENCE',
    titre: '',
    dateaudience: '',
    heureaudience: '',
    lieu: '',
    description: '',
    remarques: '',
    statut: 'PLANIFIE',
    rappel_24h: true,
    rappel_1h: false
  });
  const [tribunaux, setTribunaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [titleEdited, setTitleEdited] = useState(false);

  // Map simple pour libellés de type côté UI (évite dépendance backend)
  const TYPE_LABELS = {
    'AUDIENCE': 'Audience judiciaire',
    'CONSULTATION': 'Consultation avocat-client',
    'REUNION': 'Réunion de préparation',
    'SIGNATURE': 'Signature de documents',
    'AUTRE': 'Autre rendez-vous'
  };
  const getTypeLabel = (value) => TYPE_LABELS[value] || 'Autre rendez-vous';

  useEffect(() => {
    if (isOpen) {
      if (rendezVous) {
        setFormData({
          type_rendez_vous: rendezVous.type_rendez_vous || 'AUDIENCE',
          titre: rendezVous.titre || getTypeLabel(rendezVous.type_rendez_vous || 'AUDIENCE'),
          dateaudience: rendezVous.dateaudience || new Date().toISOString().split('T')[0],
          heureaudience: rendezVous.heureaudience || '',
          lieu: rendezVous.lieu || '',
          description: rendezVous.description || '',
          remarques: rendezVous.remarques || '',
          statut: rendezVous.statut || 'PLANIFIE',
          rappel_24h: !!rendezVous.rappel_24h,
          rappel_1h: !!rendezVous.rappel_1h
        });
      } else {
      // Pré-remplir avec les données de l'affaire
      setFormData(prev => ({
        ...prev,
          dateaudience: prev.dateaudience || new Date().toISOString().split('T')[0],
        titre: prev.titre || getTypeLabel(prev.type_rendez_vous || 'AUDIENCE'),
        lieu: affaire?.idtribunal?.nomtribunal || ''
      }));
      }
      // Charger les tribunaux
      loadTribunaux();
    }
  }, [isOpen, affaire, rendezVous]);

  const loadTribunaux = async () => {
    try {
      const response = await api.get('/api/tribunals/');
      setTribunaux(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tribunaux:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.titre || !formData.dateaudience) {
      alert('Veuillez remplir au moins le titre et la date');
      return;
    }

    setLoading(true);
    try {
      const idAffaireValue = rendezVous?.affaire_id || (affaire ? (typeof affaire === 'object' ? affaire.idaffaire : affaire) : null);
      const rendezVousData = {
        idaffaire: idAffaireValue,
        idtribunal: formData.lieu ? (tribunaux.find(t => t.nomtribunal === formData.lieu)?.idtribunal || null) : null,
        type_rendez_vous: formData.type_rendez_vous,
        // Conserver le titre saisi (ou prérempli) par l'utilisateur
        titre: formData.titre || getTypeLabel(formData.type_rendez_vous),
        dateaudience: formData.dateaudience,
        heureaudience: formData.heureaudience || null,
        lieu: formData.lieu || null,
        description: formData.description || null,
        remarques: formData.remarques || null,
        statut: formData.statut,
        rappel_24h: formData.rappel_24h,
        rappel_1h: formData.rappel_1h
      };
      if (isEdit && rendezVous?.idaudience) {
        await api.patch(`/api/audiences/${rendezVous.idaudience}/`, rendezVousData);
      } else {
      await api.post('/api/audiences/', rendezVousData);
      }
      
      onSave();
      onClose();
      setFormData({
        type_rendez_vous: 'AUDIENCE',
        titre: '',
        dateaudience: '',
        heureaudience: '',
        lieu: '',
        description: '',
        remarques: '',
        statut: 'PLANIFIE',
        rappel_24h: true,
        rappel_1h: false
      });
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      console.error('Détails serveur:', error?.response?.data);
      alert('Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typesRendezVous = [
    { value: 'AUDIENCE', label: 'Audience judiciaire', icon: '⚖️' },
    { value: 'CONSULTATION', label: 'Consultation avocat-client', icon: '👥' },
    { value: 'REUNION', label: 'Réunion de préparation', icon: '🤝' },
    { value: 'SIGNATURE', label: 'Signature de documents', icon: '✍️' },
    { value: 'AUTRE', label: 'Autre rendez-vous', icon: '📅' }
  ];

  const statuts = [
    { value: 'PLANIFIE', label: 'Planifié', color: '#2196F3' },
    { value: 'CONFIRME', label: 'Confirmé', color: '#4CAF50' },
    { value: 'ANNULE', label: 'Annulé', color: '#f44336' },
    { value: 'TERMINE', label: 'Terminé', color: '#9E9E9E' },
    { value: 'REPORTE', label: 'Reporté', color: '#FF9800' }
  ];

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, color: 'var(--primary-blue)' }}>
            {isEdit ? '✏️ Modifier le rendez-vous' : '📅 Planifier un rendez-vous'}
          </h3>
          <button 
            onClick={onClose}
            style={closeButtonStyle}
          >
            ✕
          </button>
        </div>

        <div style={modalBodyStyle}>
          {/* Type de rendez-vous */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Type de rendez-vous:</label>
            <div style={radioGroupStyle}>
              {typesRendezVous.map(type => (
                <label key={type.value} style={radioLabelStyle}>
                  <input
                    type="radio"
                    name="type_rendez_vous"
                    value={type.value}
                    checked={formData.type_rendez_vous === type.value}
                    onChange={(e) => {
                      const newType = e.target.value;
                      handleInputChange('type_rendez_vous', newType);
                      if (!titleEdited) {
                        handleInputChange('titre', getTypeLabel(newType));
                      }
                    }}
                    style={radioInputStyle}
                  />
                  <span style={radioTextStyle}>
                    {type.icon} {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Titre du rendez-vous:</label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => { setTitleEdited(true); handleInputChange('titre', e.target.value); }}
              placeholder="Ex: Consultation préliminaire, Audience de plaidoirie..."
              style={inputStyle}
            />
          </div>

          {/* Date et heure */}
          <div style={formRowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Date:</label>
              <input
                type="date"
                value={formData.dateaudience}
                onChange={(e) => handleInputChange('dateaudience', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Heure:</label>
              <input
                type="time"
                value={formData.heureaudience}
                onChange={(e) => handleInputChange('heureaudience', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Lieu */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Lieu:</label>
            <input
              type="text"
              value={formData.lieu}
              onChange={(e) => handleInputChange('lieu', e.target.value)}
              placeholder="Tribunal, cabinet, adresse..."
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Détails du rendez-vous, ordre du jour..."
              style={textareaStyle}
              rows={3}
            />
          </div>

          {/* Remarques */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Remarques:</label>
            <textarea
              value={formData.remarques}
              onChange={(e) => handleInputChange('remarques', e.target.value)}
              placeholder="Informations supplémentaires..."
              style={textareaStyle}
              rows={2}
            />
          </div>

          {/* Statut */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Statut:</label>
            <select
              value={formData.statut}
              onChange={(e) => handleInputChange('statut', e.target.value)}
              style={selectStyle}
            >
              {statuts.map(statut => (
                <option key={statut.value} value={statut.value}>
                  {statut.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Rappels:</label>
            <div style={checkboxGroupStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={formData.rappel_24h}
                  onChange={(e) => handleInputChange('rappel_24h', e.target.checked)}
                  style={checkboxStyle}
                />
                Rappel 24h avant
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={formData.rappel_1h}
                  onChange={(e) => handleInputChange('rappel_1h', e.target.checked)}
                  style={checkboxStyle}
                />
                Rappel 1h avant
              </label>
            </div>
          </div>
        </div>

        <div style={modalFooterStyle}>
          <button
            onClick={onClose}
            style={cancelButtonStyle}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            style={submitButtonStyle}
            disabled={loading}
          >
            {loading ? (isEdit ? '⏳ Enregistrement...' : '⏳ Création...') : (isEdit ? '💾 Enregistrer' : '📅 Planifier le rendez-vous')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  maxWidth: '600px',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const modalHeaderStyle = {
  padding: '1.5rem 1.5rem 1rem',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#666',
  padding: '0.5rem',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalBodyStyle = {
  padding: '1.5rem',
  overflowY: 'auto',
  flex: 1
};

const modalFooterStyle = {
  padding: '1rem 1.5rem',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
};

const formGroupStyle = {
  marginBottom: '1.5rem'
};

const formRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '600',
  color: 'var(--text-dark)',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  resize: 'vertical',
  minHeight: '80px',
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  backgroundColor: 'white',
  boxSizing: 'border-box'
};

const radioGroupStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '0.75rem'
};

const radioLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const radioInputStyle = {
  margin: 0
};

const radioTextStyle = {
  fontSize: '0.9rem'
};

const checkboxGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const checkboxStyle = {
  margin: 0
};

const cancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: 'white',
  color: '#666',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.2s'
};

const submitButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: '6px',
  background: 'var(--primary-blue)',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s'
};

export default RendezVousModal;


