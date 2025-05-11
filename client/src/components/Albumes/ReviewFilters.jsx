import React from 'react';
import { FaSortAmountDown, FaSortAmountUp, FaStar } from 'react-icons/fa';
import './ReviewFilters.css';

const ReviewFilters = ({ 
  sortOption, 
  setSortOption, 
  ratingFilter, 
  setRatingFilter 
}) => {
  return (
    <div className="review-filters">
      <div className="filter-group">
        <label>Ordenar por:</label>
        <div className="filter-buttons">
          <button 
            className={`filter-button ${sortOption === 'newest' ? 'active' : ''}`}
            onClick={() => setSortOption('newest')}
          >
            <FaSortAmountDown /> Más recientes
          </button>
          <button 
            className={`filter-button ${sortOption === 'oldest' ? 'active' : ''}`}
            onClick={() => setSortOption('oldest')}
          >
            <FaSortAmountUp /> Más antiguos
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label>Filtrar por:</label>
        <div className="filter-buttons">
          <button 
            className={`filter-button ${ratingFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRatingFilter('all')}
          >
            Todas
          </button>
          <button 
            className={`filter-button ${ratingFilter === 'highRated' ? 'active' : ''}`}
            onClick={() => setRatingFilter('highRated')}
          >
            <FaStar /> Alta valoración
          </button>
          <button 
            className={`filter-button ${ratingFilter === 'lowRated' ? 'active' : ''}`}
            onClick={() => setRatingFilter('lowRated')}
          >
            <FaStar className="low-rated" /> Baja valoración
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;