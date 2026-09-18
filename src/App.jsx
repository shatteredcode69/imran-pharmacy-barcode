import { useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Barcode, CalendarDays, Check, ChevronDown, Download, FilePlus2, LayoutGrid, Package, Pencil, Plus, Printer, QrCode, Search, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'imran-pharmacy-barcode-catalog-v1';
const SERIAL_KEY = 'imran-pharmacy-barcode-next-serial-v1';

function normalize(value) { return value.trim().replace(/\s+/g, ' '); }
function serialValue(value) { return String(value ?? '').replace(/^0+(?=\d)/, '') || '0'; }
function displayDate(value) {
  if (!value) return 'Expiry not set';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
function expiryTone(value) {
  if (!value) return 'neutral';
  const days = Math.ceil((new Date(`${value}T00:00:00`) - new Date()) / 86400000);
  return days < 0 ? 'danger' : days < 90 ? 'warning' : 'good';
}
function makeMedicine(name, serial, expiryDate = '') {
  const now = new Date().toISOString();
  return { id: `medicine-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`, serial: String(serial).padStart(4, '0'), name, expiryDate, createdAt: now, updatedAt: now };
}

function App() {
  const [medicines, setMedicines] = useState([]);
  const [nextSerial, setNextSerial] = useState(9001);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [activeTab, setActiveTab] = useState('catalog');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const savedSerial = Number(localStorage.getItem(SERIAL_KEY));
    if (stored) setMedicines(JSON.parse(stored));
    else fetch(`${import.meta.env.BASE_URL}medicines.json`).then((response) => response.json()).then((data) => setMedicines(data.map((item) => makeMedicine(item.name, item.id))));
    if (savedSerial > 0) setNextSerial(savedSerial);
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines)); }, [medicines, ready]);
  useEffect(() => { if (ready) localStorage.setItem(SERIAL_KEY, String(nextSerial)); }, [nextSerial, ready]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer); }, [toast]);

  const filtered = useMemo(() => medicines.filter((medicine) => `${medicine.name} ${medicine.serial}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    if (sort === 'serial') return Number(a.serial) - Number(b.serial);
    if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
    if (sort === 'expiry') return (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999');
    return a.name.localeCompare(b.name);
  }), [medicines, query, sort]);

  const saveMedicine = (draft) => {
    const name = normalize(draft.name);
    if (!name) return setToast('Medicine name is required.');
    const duplicate = medicines.some((medicine) => medicine.name.toLowerCase() === name.toLowerCase() && medicine.id !== draft.id);
    if (duplicate) return setToast('That medicine is already in the catalog.');
    if (draft.id) {
      setMedicines((current) => current.map((medicine) => medicine.id === draft.id ? { ...medicine, name, expiryDate: draft.expiryDate, updatedAt: new Date().toISOString() } : medicine));
      setToast('Medicine details updated.');
    } else {
      const created = makeMedicine(name, nextSerial, draft.expiryDate);
      setMedicines((current) => [created, ...current]);
      setNextSerial((value) => value + 1);
      setToast('Medicine added to your catalog.');
    }
    setEditing(null);
  };

  const removeMedicine = (medicine) => {
    if (Number(medicine.serial) < 9001) return setToast('Seed medicines cannot be deleted.');
    if (window.confirm(`Delete ${medicine.name}?`)) { setMedicines((current) => current.filter((item) => item.id !== medicine.id)); setToast('Medicine removed.'); }
  };

  if (!ready) return <div className="loading-screen"><Sparkles size={22} /> Loading your catalog...</div>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Barcode size={23} /></span><div><strong>Imran Pharmacy</strong><span>Barcode desk</span></div></div>
      <nav className="nav-tabs"><button className={activeTab === 'catalog' ? 'active' : ''} onClick={() => setActiveTab('catalog')}><LayoutGrid size={16} /> Catalog</button><button className={activeTab === 'lookup' ? 'active' : ''} onClick={() => setActiveTab('lookup')}><QrCode size={16} /> Scan lookup</button></nav>
      <div className="topbar-status"><ShieldCheck size={16} /> Local & private</div>
    </header>

    <main className="main-content">
      <section className="intro-row"><div><p className="eyebrow">PHARMACY OPERATIONS / 01</p><h1>Labels that stay<br /><em>exactly right.</em></h1><p className="lede">Create dependable barcode and QR labels for every medicine in your catalog.</p></div><div className="intro-art"><Barcode size={120} strokeWidth={1} /><span>IMRAN<br />PHARMACY</span></div></section>
      {activeTab === 'catalog' ? <>
        <section className="stats-grid"><Stat label="Total medicines" value={medicines.length.toLocaleString()} icon={<Package />} /><Stat label="With expiry" value={medicines.filter((item) => item.expiryDate).length} icon={<CalendarDays />} tone="orange" /><Stat label="Custom entries" value={medicines.filter((item) => Number(item.serial) >= 9001).length} icon={<Sparkles />} tone="blue" /></section>
        <section className="toolbar"><div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicine or serial..." /></div><div className="toolbar-actions"><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name</option><option value="serial">Serial</option><option value="newest">Newest</option><option value="expiry">Expiry date</option></select><ChevronDown size={15} /></label><button className="primary-button" onClick={() => setEditing({ name: '', expiryDate: '' })}><Plus size={17} /> Add medicine</button></div></section>
        <section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">MEDICINE CATALOG</p><h2>{query ? `${filtered.length} matches` : 'Your medicines'}</h2></div><span className="count-pill">{medicines.length.toLocaleString()} records</span></div><div className="medicine-table"><div className="table-head"><span>Medicine</span><span>Serial</span><span>Expiry</span><span>Actions</span></div>{filtered.slice(0, 300).map((medicine) => <MedicineRow key={medicine.id} medicine={medicine} onOpen={() => setSelected(medicine)} onEdit={() => setEditing(medicine)} onRemove={() => removeMedicine(medicine)} />)}</div>{filtered.length > 300 && <p className="table-note">Showing the first 300 matches. Refine your search to find a specific medicine.</p>}{filtered.length === 0 && <div className="empty-state"><Search size={30} /><h3>No medicines found</h3><p>Try a different name or add a new entry.</p></div>}</section>
      </> : <Lookup medicines={medicines} />}
    </main>

    {editing && <MedicineForm draft={editing} nextSerial={nextSerial} onClose={() => setEditing(null)} onSave={saveMedicine} />}
    {selected && <LabelModal medicine={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} />}
    {toast && <div className="toast"><Check size={17} /> {toast}</div>}
  </div>;
}

function Stat({ label, value, icon, tone = '' }) { return <div className={`stat-card ${tone}`}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function MedicineRow({ medicine, onOpen, onEdit, onRemove }) { const tone = expiryTone(medicine.expiryDate); return <div className="table-row"><button className="medicine-name" onClick={onOpen}><span className="medicine-symbol"><Package size={16} /></span><span><strong>{medicine.name}</strong><small>{Number(medicine.serial) >= 9001 ? 'Custom entry' : 'Seed catalog'}</small></span></button><code>{medicine.serial}</code><span className={`expiry ${tone}`}><i />{displayDate(medicine.expiryDate)}</span><div className="row-actions"><button title="Generate label" onClick={onOpen}><Barcode size={17} /></button><button title="Edit medicine" onClick={onEdit}><Pencil size={16} /></button>{Number(medicine.serial) >= 9001 && <button title="Delete medicine" onClick={onRemove}><Trash2 size={16} /></button>}</div></div>; }

function MedicineForm({ draft, nextSerial, onClose, onSave }) { const [form, setForm] = useState({ name: draft.name || '', expiryDate: draft.expiryDate || '' }); return <div className="modal-backdrop"><form className="dialog form-dialog" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, ...form }); }}><button type="button" className="close-button" onClick={onClose}><X size={19} /></button><p className="eyebrow">{draft.id ? 'EDIT MEDICINE' : 'NEW CATALOG ENTRY'}</p><h2>{draft.id ? 'Update medicine' : 'Add a medicine'}</h2><p className="dialog-copy">Give this item a stable identity for every label you print.</p><label>Medicine name<input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Panadol 500mg" /></label><label>Expiry date <span className="optional">optional</span><input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} /></label><div className="serial-preview"><span>Permanent serial</span><strong>{draft.serial || String(nextSerial).padStart(4, '0')}</strong></div><button className="primary-button full" type="submit"><Check size={17} /> {draft.id ? 'Save changes' : 'Add medicine'}</button></form></div>; }

function Lookup({ medicines }) { const [value, setValue] = useState(''); const match = medicines.find((medicine) => serialValue(medicine.serial) === serialValue(value)); return <section className="lookup-page"><div className="lookup-intro"><p className="eyebrow">SCAN LOOKUP / 02</p><h2>Find a medicine<br /><em>by its serial.</em></h2><p>Paste the value from any barcode or QR scanner. Leading zeroes are supported.</p></div><div className="lookup-box"><Search size={20} /><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Scan or enter serial number..." /><button onClick={() => setValue('')}>Clear</button></div>{value && (match ? <div className="lookup-result"><div className="result-check"><Check size={20} /></div><div><p className="eyebrow">MATCH FOUND</p><h3>{match.name}</h3><p>Serial <code>{match.serial}</code> · {displayDate(match.expiryDate)}</p></div></div> : <div className="not-found"><QrCode size={24} /><div><h3>No match found</h3><p>Check the scanned serial and try again.</p></div></div>)}</section>; }

function LabelModal({ medicine, onClose, onEdit }) { const barcodeRef = useRef(null); const qrRef = useRef(null); const [label, setLabel] = useState(null); useEffect(() => { if (!barcodeRef.current || !qrRef.current) return; JsBarcode(barcodeRef.current, medicine.serial, { format: 'CODE128', width: 2.3, height: 70, displayValue: false, margin: 8, background: '#ffffff', lineColor: '#20253a' }); QRCode.toCanvas(qrRef.current, medicine.serial, { width: 110, margin: 1, color: { dark: '#20253a', light: '#ffffff' } }); }, [medicine]); const download = (type) => { const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 560; const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#20253a'; context.fillRect(0, 0, canvas.width, 92); context.fillStyle = '#fff'; context.font = '700 32px Arial'; context.fillText('IMRAN PHARMACY', 38, 57); context.fillStyle = '#20253a'; context.font = '700 28px Arial'; context.fillText(medicine.name.slice(0, 42), 38, 145); context.drawImage(barcodeRef.current, 38, 175, 575, 150); context.drawImage(qrRef.current, 675, 170, 150, 150); context.font = '700 26px monospace'; context.fillText(`SERIAL  ${medicine.serial}`, 38, 365); context.font = '500 23px Arial'; context.fillText(`EXPIRY  ${displayDate(medicine.expiryDate)}`, 38, 412); const link = document.createElement('a'); link.download = `imran-pharmacy-${medicine.serial}.${type === 'png' ? 'png' : 'png'}`; link.href = canvas.toDataURL('image/png'); link.click(); setLabel('Downloaded'); setTimeout(() => setLabel(null), 1800); }; return <div className="modal-backdrop"><div className="dialog label-dialog"><button className="close-button" onClick={onClose}><X size={19} /></button><div className="label-dialog-head"><div><p className="eyebrow">LABEL PREVIEW</p><h2>{medicine.name}</h2></div><button className="text-button" onClick={onEdit}><Pencil size={15} /> Edit</button></div><div className="label-preview"><div className="label-brand">IMRAN PHARMACY</div><h3>{medicine.name}</h3><div className="codes"><div><canvas ref={barcodeRef} /><span>CODE128 / {medicine.serial}</span></div><div className="qr-wrap"><canvas ref={qrRef} /><span>QR / {medicine.serial}</span></div></div><div className="label-meta"><span><b>Serial</b>{medicine.serial}</span><span><b>Expiry</b>{displayDate(medicine.expiryDate)}</span></div></div><div className="dialog-actions"><button className="secondary-button" onClick={() => window.print()}><Printer size={16} /> Print</button><button className="primary-button" onClick={() => download('png')}><Download size={16} /> {label || 'Download label'}</button></div><p className="scan-note"><ShieldCheck size={15} /> Both codes contain only the exact medicine serial.</p></div></div>; }

export default App;
