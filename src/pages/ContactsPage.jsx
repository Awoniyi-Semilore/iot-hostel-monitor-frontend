import { useState } from 'react';
import { useReadings } from '../queries/useReadings';
import { useContacts, useCreateContact } from '../queries/useContacts';
import { Users, Plus, Phone, User, Loader } from 'lucide-react';

function ContactCard({ contact }) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-4 flex items-center gap-4">
      <div className="bg-white/5 p-2.5 rounded-xl shrink-0">
        <User size={16} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{contact.name ?? 'Unnamed'}</p>
        <p className="text-xs text-slate-500 font-mono mt-0.5">{contact.phone}</p>
      </div>
    </div>
  );
}

function AddContactForm({ location, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { mutate, isPending, isError, error } = useCreateContact();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    mutate(
      { location, phone: phone.trim(), name: name.trim() || undefined },
      { onSuccess: () => { setName(''); setPhone(''); onSuccess?.(); } }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-white/5 rounded-4xl p-5 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add Contact</p>

      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
      />
      <input
        type="tel"
        placeholder="Phone e.g. +2348012345678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
      />

      {isError && (
        <p className="text-[10px] text-red-400 uppercase tracking-widest font-black">
          {error?.message ?? 'Failed to add contact.'}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !phone.trim()}
        className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 text-xs font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        {isPending ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
        {isPending ? 'Adding...' : 'Add Contact'}
      </button>
    </form>
  );
}

export default function ContactsPage() {
  const { data: readingsData } = useReadings();
  const location = readingsData?.data[0]?.location;

  const { data, isLoading, isError } = useContacts(location);
  const contacts = data?.data ?? [];

  return (
    <div className="flex flex-col py-8 px-4 max-w-md w-full mx-auto space-y-6">

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">SMS Alerts</p>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Contacts</h1>
        {location && (
          <p className="text-xs text-slate-500 mt-1 font-mono">{location.replaceAll('_', ' ')}</p>
        )}
      </div>

      <AddContactForm location={location} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registered</p>
          {!isLoading && (
            <span className="text-[9px] font-black text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
              {contacts.length}
            </span>
          )}
        </div>

        {isLoading && (
          <p className="text-xs text-slate-500 uppercase tracking-widest animate-pulse text-center py-6">Loading...</p>
        )}

        {isError && (
          <p className="text-xs text-red-400 uppercase tracking-widest text-center py-6">Failed to load contacts.</p>
        )}

        {!isLoading && !isError && contacts.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <Users size={32} className="mx-auto text-slate-700" />
            <p className="text-xs text-slate-600 uppercase tracking-widest font-black">No contacts yet</p>
          </div>
        )}

        {contacts.map((c) => <ContactCard key={c.id} contact={c} />)}
      </div>

    </div>
  );
}
