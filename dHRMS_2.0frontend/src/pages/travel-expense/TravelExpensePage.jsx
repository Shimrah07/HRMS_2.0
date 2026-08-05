import React from 'react';
import { Navigate } from 'react-router-dom';

export default function TravelExpensePage() {
  return <Navigate to="/travel-expense/travel-requests" replace />;
}
