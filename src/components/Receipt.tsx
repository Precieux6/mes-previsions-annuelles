import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface ReceiptData {
  reference: string;
  eventName?: string;
  date: string;
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  birthdate?: string;
  sign?: string;
  prestation?: string;
  total: number;
  currency?: string;
  verifyUrl: string;
  organizer?: string;
  signatureText?: string;
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n).replace(/[\u202f\u00a0]/g, ' ') + ' F';

const rowsOf = (d: ReceiptData) => {
  const rows: Array<[string, string]> = [
    ['Prestation', d.prestation || 'Prévision annuelle 2027'],
    ['Date', d.date],
    ['Nom', d.lastName.toUpperCase()],
    ['Prénom(s)', d.firstName],
    ['Téléphone', d.phone || '–'],
    ['E-mail', d.email || '–'],
  ];
  if (d.birthdate) {
    rows.push(['Date de naissance', d.birthdate + (d.sign ? ` (${d.sign})` : '')]);
  }
  rows.push(['Nature de la prestation', d.prestation || 'Prévision annuelle 2027']);
  rows.push(['Montant payé', formatFcfa(d.total)]);
  rows.push(['N° d’identification', d.reference]);
  return rows;
};

const loadImg = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((ok) => {
    if (!src) return ok(null);
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });

async function drawReceipt(d: ReceiptData, qrDataUrl: string): Promise<HTMLCanvasElement> {
  const W = 800;
  const H = 1140;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  if (!c) throw new Error('Contexte canvas indisponible.');

  // Fond blanc
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, W, H);

  // Bordure en pointillés (exactement comme le modèle de reçu)
  c.strokeStyle = '#9ca3af';
  c.setLineDash([10, 8]);
  c.lineWidth = 3;
  c.strokeRect(24, 24, W - 48, H - 48);
  c.setLineDash([]);

  // Titre principal
  c.fillStyle = '#1b1840';
  c.textAlign = 'left';
  c.font = 'bold 44px Georgia, serif';
  c.fillText('Reçu de paiement', 60, 110);

  // Lignes du reçu
  let y = 190;
  const rows = rowsOf(d);
  rows.forEach(([label, val]) => {
    c.font = '22px system-ui, -apple-system, sans-serif';
    c.fillStyle = '#615d85';
    c.textAlign = 'left';
    c.fillText(label, 60, y);

    c.fillStyle = '#1b1840';
    c.font = 'bold 24px system-ui, -apple-system, sans-serif';
    c.textAlign = 'right';
    c.fillText(val, W - 60, y);

    // Ligne de séparation
    c.strokeStyle = '#e2e0f0';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(60, y + 20);
    c.lineTo(W - 60, y + 20);
    c.stroke();

    y += 64;
  });

  // QR Code en bas à gauche
  const q = await loadImg(qrDataUrl);
  if (q) {
    c.drawImage(q, 60, 960, 130, 130);
  }

  // Signature en bas à droite
  c.font = 'italic 32px Georgia, serif';
  c.fillStyle = '#1b1840';
  c.textAlign = 'right';
  c.fillText(d.signatureText || 'A votre service...', W - 60, 1030);

  // Trait sous la mention manuscrite
  c.strokeStyle = '#1b1840';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(W - 320, 1044);
  c.lineTo(W - 60, 1044);
  c.stroke();

  // Nom du prestataire
  c.font = '22px Georgia, serif';
  c.fillStyle = '#615d85';
  c.textAlign = 'right';
  c.fillText(d.organizer || 'Monsieur Folly Valère TOSSOU', W - 60, 1076);

  return cv;
}

function pdfFromJpeg(bytes: Uint8Array, w: number, h: number): Blob {
  const pw = 420;
  const ph = Math.round((420 * h) / w);
  const enc = new TextEncoder();
  const parts: any[] = [];
  const offs: number[] = [];
  let len = 0;

  const add = (x: string | Uint8Array) => {
    const b = typeof x === 'string' ? enc.encode(x) : x;
    parts.push(b);
    len += b.length;
  };
  const obj = (n: number, s: string) => {
    offs[n] = len;
    add(n + ' 0 obj\n' + s + '\nendobj\n');
  };

  add('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offs[4] = len;
  add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bytes.length + ' >>\nstream\n');
  add(bytes);
  add('\nendstream\nendobj\n');
  const cs = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
  obj(5, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
  const x = len;
  let t = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) t += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
  add(t + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF');

  return new Blob(parts, { type: 'application/pdf' });
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

export default function Receipt({ d }: { d: ReceiptData }) {
  const [qr, setQr] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(d.verifyUrl, { margin: 1, width: 260 })
      .then(setQr)
      .catch(() => {});
  }, [d.verifyUrl]);

  const handleDownload = async (kind: 'png' | 'pdf') => {
    setMsg('');
    setIsExporting(true);
    try {
      const cv = await drawReceipt(d, qr);
      const fileName = `recu-${d.reference}`;
      if (kind === 'png') {
        const blob = await new Promise<Blob | null>((resolve) => cv.toBlob(resolve, 'image/png'));
        if (blob) saveBlob(blob, `${fileName}.png`);
      } else {
        const jpegBlob = await new Promise<Blob | null>((resolve) => cv.toBlob(resolve, 'image/jpeg', 0.95));
        if (jpegBlob) {
          const buffer = new Uint8Array(await jpegBlob.arrayBuffer());
          const pdfBlob = pdfFromJpeg(buffer, cv.width, cv.height);
          saveBlob(pdfBlob, `${fileName}.pdf`);
        }
      }
    } catch {
      setMsg('Téléchargement impossible. Vous pouvez faire une capture d’écran du reçu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Bonjour, voici mon reçu de paiement pour les Prévisions Annuelles 2027 (${d.reference}) d'un montant de ${formatFcfa(d.total)} : ${d.verifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="receipt-wrapper">
      <div className="receipt-card">
        <h3 className="receipt-title">Reçu de paiement</h3>
        <div className="receipt-rows">
          {rowsOf(d).map(([label, val]) => (
            <div className="receipt-row" key={label}>
              <span className="receipt-label">{label}</span>
              <strong className="receipt-value">{val}</strong>
            </div>
          ))}
        </div>

        <div className="receipt-footer">
          <div className="receipt-qr-block">
            {qr ? <img src={qr} alt="QR Code de vérification" className="receipt-qr-img" /> : <div className="receipt-qr-placeholder" />}
            <span className="receipt-qr-hint">Scan pour vérification</span>
          </div>
          <div className="receipt-sig-block">
            <span className="receipt-sig-quote">{d.signatureText || 'A votre service...'}</span>
            <div className="receipt-sig-line" />
            <span className="receipt-sig-name">{d.organizer || 'Monsieur Folly Valère TOSSOU'}</span>
          </div>
        </div>
      </div>

      <div className="receipt-actions">
        <button
          type="button"
          className="receipt-btn receipt-btn-primary"
          disabled={isExporting}
          onClick={() => handleDownload('pdf')}
        >
          📥 Télécharger en PDF
        </button>
        <button
          type="button"
          className="receipt-btn receipt-btn-secondary"
          disabled={isExporting}
          onClick={() => handleDownload('png')}
        >
          🖼️ Télécharger en image (PNG)
        </button>
        <button
          type="button"
          className="receipt-btn receipt-btn-whatsapp"
          onClick={handleWhatsAppShare}
        >
          💬 Partager sur WhatsApp
        </button>
      </div>

      {msg && <p className="form-error-msg">{msg}</p>}
    </div>
  );
}
