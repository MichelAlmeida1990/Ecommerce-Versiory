import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { setSelectedTenant } from '../services/tenantContext';

const StoreWrapper: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  useEffect(() => {
    if (tenantSlug) {
      setSelectedTenant(tenantSlug);
    }
  }, [tenantSlug]);

  return <Navigate to="/" replace />;
};

export default StoreWrapper;
