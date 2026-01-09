import React from 'react';

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
      <button 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
        className="btn-secondary"
      >
        Anterior
      </button>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        Página {currentPage} de {totalPages}
      </span>
      <button 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
        className="btn-secondary"
      >
        Siguiente
      </button>
    </div>
  );
};

export default PaginationControls;
