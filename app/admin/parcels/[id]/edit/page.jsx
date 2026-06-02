'use client';
import { useNav } from '@/src/lib/nav';
import { DATA } from '@/src/data';
import ParcelFormPage from '@/src/screens/ParcelForm';

export default function EditParcelPage({ params }) {
  const onNav = useNav();
  const parcel = DATA.PARCELS.find(p => p.id === params.id) || null;
  return <ParcelFormPage mode="edit" parcel={parcel} onNav={onNav} />;
}
