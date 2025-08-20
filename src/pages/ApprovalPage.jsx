import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ApprovalPage() {
  // Página obsoleta: redireciona para Reposição, onde as aprovações agora estão como aba
  return <Navigate to="/replenishment" replace />;
}
