import React from 'react';
import { FaSortAmountDown, FaSortAmountUp, FaStar, FaSort } from 'react-icons/fa';
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
        <label>Ordenar por fecha:</label>
        <div className="filter-buttons">
          <button 
            className={`filter-button ${sortOption === 'newest' && ratingFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSortOption('newest');
              setRatingFilter('all');
            }}
          >
            <FaSortAmountDown /> Más recientes
          </button>
          <button 
            className={`filter-button ${sortOption === 'oldest' && ratingFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSortOption('oldest');
              setRatingFilter('all');
            }}
          >
            <FaSortAmountUp /> Más antiguos
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label>Ordenar por valoración:</label>
        <div className="filter-buttons">
          <button 
            className={`filter-button ${ratingFilter === 'highRated' ? 'active' : ''}`}
            onClick={() => setRatingFilter('highRated')}
          >
            <FaStar /> Mayor a menor
          </button>
          <button 
            className={`filter-button ${ratingFilter === 'lowRated' ? 'active' : ''}`}
            onClick={() => setRatingFilter('lowRated')}
          >
            <FaStar className="low-rated" /> Menor a mayor
          </button>
          <button 
            className={`filter-button ${ratingFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRatingFilter('all')}
          >
            <FaSort /> Sin ordenar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;