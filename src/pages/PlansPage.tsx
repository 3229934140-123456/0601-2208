import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Home, ChevronRight, ListChecks } from 'lucide-react';
import PlanToolbar from '@/components/plans/PlanToolbar';
import PlanTable from '@/components/plans/PlanTable';
import RescheduleModal from '@/components/plans/RescheduleModal';
import BookingForm from '@/components/booking/BookingForm';
import { usePortStore } from '@/store/usePortStore';
import { exportTodayBookings } from '@/utils/exportUtils';
import type { Booking, BookingStatus } from '@/types';

export default function PlansPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const [date, setDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);

  const bookings = usePortStore((s) => s.bookings);
  const berths = usePortStore((s) => s.berths);
  const storeUpdateBookingStatus = usePortStore((s) => s.updateBookingStatus);
  const updateBooking = usePortStore((s) => s.updateBooking);

  const filteredBookings = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const dateStr = date.toDateString();
    return bookings.filter((b) => {
      const matchSearch = !searchLower || b.shipName.toLowerCase().includes(searchLower) || b.agentName.toLowerCase().includes(searchLower);
      const matchStatus = status === 'all' || b.status === status;
      const matchDate = new Date(b.eta).toDateString() === dateStr || new Date(b.etb).toDateString() === dateStr;
      return matchSearch && matchStatus && matchDate;
    });
  }, [bookings, search, status, date]);

  const handleReschedule = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleRescheduleConfirm = (reason: string, newEtb?: Date, newEtd?: Date) => {
    if (selectedBooking) {
      storeUpdateBookingStatus(selectedBooking.id, selectedBooking.status, reason);
      if (newEtb || newEtd) {
        updateBooking(selectedBooking.id, {
          ...(newEtb && { etb: newEtb }),
          ...(newEtd && { etd: newEtd }),
        });
      }
    }
    setModalOpen(false);
    setSelectedBooking(null);
  };

  const handleAddBooking = () => {
    setBookingFormOpen(true);
  };

  const handleBookingFormSave = (assignBerth: boolean, bookingId?: string) => {
    if (assignBerth && bookingId) {
      navigate('/calendar');
    }
  };

  const handleExport = () => {
    exportTodayBookings(filteredBookings, berths);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-port-600 transition-colors">
            <Home className="h-3.5 w-3.5" />
            首页
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <ListChecks className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-800">船舶计划</span>
        </div>

        <div className="mb-4">
          <PlanToolbar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            date={date}
            onDateChange={setDate}
            onAddBooking={handleAddBooking}
            onExport={handleExport}
          />
        </div>

        <PlanTable bookings={filteredBookings} onReschedule={handleReschedule} />
      </div>

      <RescheduleModal
        open={modalOpen}
        booking={selectedBooking}
        onClose={() => {
          setModalOpen(false);
          setSelectedBooking(null);
        }}
        onConfirm={handleRescheduleConfirm}
      />

      <BookingForm
        open={bookingFormOpen}
        onClose={() => setBookingFormOpen(false)}
        onSave={handleBookingFormSave}
      />
    </div>
  );
}
