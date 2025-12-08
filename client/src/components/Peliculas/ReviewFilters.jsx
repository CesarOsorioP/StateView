import React from 'react';
import './ReviewFilters.css';

const ReviewFilters = ({ sortOption, setSortOption, ratingFilter, setRatingFilter }) => {
  return (
    <div className="review-filters">
      <div className="filter-group">
        <label htmlFor="sort-select">Ordenar por:</label>
        <select 
          id="sort-select" 
          value={sortOption} 
          onChange={(e) => setSortOption(e.target.value)}
          className="filter-select"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguas</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="rating-select">Calificación:</label>
        <select 
          id="rating-select" 
          value={ratingFilter} 
          onChange={(e) => setRatingFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todas</option>
          <option value="highRated">Mejor valoradas</option>
          <option value="lowRated">Peor valoradas</option>
        </select>
      </div>
    </div>
  );
};

export default ReviewFilters;
