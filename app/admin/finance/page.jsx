'use client';
import FinanceScreen from '@/src/screens/Finance';
import { PermGuard } from '@/src/components/Shell';

export default function FinancePage() {
  return (
    <PermGuard adminOnly>
      <FinanceScreen />
    </PermGuard>
  );
}
