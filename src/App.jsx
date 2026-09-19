import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

const SERIAL_KEY = 'imran-pharmacy-next-serial-v2';

function nextSerial() {
  const saved = Number(localStorage.getItem(SERIAL_KEY));
  return saved > 0 ? saved : 90;
}

function formatSerial(value) {
  return String(value).padStart(3, '0');
}

function formatExpiry(value) {
  if (!value) return '________________';
  const [year, month, day] = value.split('-');
  return `${Number(day)}/${Number(month)}/${year}`;
}

function App() {
  const [medicine, setMedicine] = useState('');
  const [expiry, setExpiry] = useState('');
  const [serial, setSerial] = useState(() => nextSerial());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem(SERIAL_KEY, String(serial + 1));
  }, [serial]);

  const generate = (event) => {
    event.preventDefault();
    const name = medicine.trim().replace(/\s+/g, ' ');
    if (!name) {
      setNotice('Enter a medicine name first.');
      return;
    }
    setMedicine(name);
    setSerial(nextSerial());
    setNotice('Barcode ready.');
  };

  const reset = () => {
    setMedicine('');
    setExpiry('');
    setNotice('');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">||</div>
        <div>
          <p className="brand-name">Imran pharmacy</p>
          <p className="brand-caption">Barcode generator</p>
        </div>
      </header>

      <section className="workspace">
        <div className="intro">
          <p className="eyebrow">NEW LABEL</p>
          <h1>Generate a pharmacy barcode.</h1>
          <p>Enter the medicine details to create a numbered label in the same format as your reference.</p>
        </div>

        <div className="generator-grid">
          <form className="details-panel" onSubmit={generate}>
            <label htmlFor="medicine">Medicine name</label>
            <input id="medicine" autoFocus value={medicine} onChange={(event) => setMedicine(event.target.value)} placeholder="e.g. Cap ampiclox 500mg" />

            <label htmlFor="expiry">Expiry date <span>optional</span></label>
            <input id="expiry" type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} />

            <div className="serial-note"><span>Next serial</span><strong>{formatSerial(serial)}</strong></div>
            <button className="generate-button" type="submit">Generate barcode</button>
            {notice && <p className="notice" role="status">{notice}</p>}
          </form>

          <LabelPreview medicine={medicine.trim() || 'Your medicine'} expiry={expiry} serial={formatSerial(serial)} />
        </div>

        <button className="clear-button" type="button" onClick={reset}>Clear fields</button>
      </section>
    </main>
  );
}

function LabelPreview({ medicine, expiry, serial }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!barcodeRef.current) return;
    JsBarcode(barcodeRef.current, serial, {
      format: 'CODE128',
      width: 2.25,
      height: 82,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#161616',
    });
  }, [serial]);

  const download = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 650;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#161616';
    context.textAlign = 'center';
    context.font = '500 52px Georgia, serif';
    context.fillText('Imran pharmacy', 450, 76);
    context.drawImage(barcodeRef.current, 75, 115, 750, 190);
    context.font = '500 48px Arial, sans-serif';
    context.fillText(serial, 450, 370);
    context.font = '400 39px Arial, sans-serif';
    context.fillText(medicine.slice(0, 30), 450, 465);
    context.fillText(`Exp  ${formatExpiry(expiry)}`, 450, 535);
    const link = document.createElement('a');
    link.download = `imran-pharmacy-${serial}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const print = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=600');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Imran pharmacy ${serial}</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh} .label{width:90mm;padding:8mm;text-align:center;font-family:Arial,sans-serif} img{width:100%;height:auto} h1{font:500 25px Georgia,serif;margin:0 0 8mm} .serial{font-size:24px;margin:5mm 0} p{font-size:19px;margin:4mm 0}</style></head><body><div class="label"><h1>Imran pharmacy</h1><img src="${barcodeRef.current.toDataURL()}" /><div class="serial">${serial}</div><p>${medicine}</p><p>Exp&nbsp;&nbsp;${formatExpiry(expiry)}</p></div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="preview-panel">
      <div className="preview-heading"><span>LABEL PREVIEW</span><span>CODE 128</span></div>
      <div className="label">
        <h2>Imran pharmacy</h2>
        <svg ref={barcodeRef} aria-label={`Barcode ${serial}`} />
        <strong className="label-serial">{serial}</strong>
        <p>{medicine}</p>
        <p>Exp&nbsp;&nbsp;{formatExpiry(expiry)}</p>
      </div>
      <div className="preview-actions"><button type="button" onClick={download}>Download PNG</button><button type="button" onClick={print}>Print label</button></div>
    </section>
  );
}

export default App;
