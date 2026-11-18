// Reçu PDF avec code de vérification (HMAC, non devinable) et QR code.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { createHmac } from 'crypto';

export function codeVerification(reference: string): string {
  const secret = process.env.RECEIPT_SECRET;
  if (!secret) throw new Error('RECEIPT_SECRET non configurée.');
  const h = createHmac('sha256', secret).update(reference).digest('hex');
  return `REC-${h.slice(0, 12).toUpperCase()}`;
}

export interface DonneesRecu {
  reference: string; nomClient: string; montant: number; devise: string;
  dateEmission: Date; numeroTransaction: string; baseUrl: string;
}

export async function genererRecu(d: DonneesRecu): Promise<{ pdf: Buffer; code: string }> {
  const code = codeVerification(d.reference);
  const qrPng = await QRCode.toBuffer(`${d.baseUrl}/verifier?code=${code}`, { width: 220, margin: 1 });
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const police = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const violet = rgb(0.23, 0.13, 0.5);
  const gris = rgb(0.35, 0.35, 0.4);
  page.drawText('Mes prévisions annuelles', { x: 50, y: 780, size: 22, font: gras, color: violet });
  page.drawText('Reçu de paiement', { x: 50, y: 752, size: 14, font: police, color: gris });
  const lignes: Array<[string, string]> = [
    ['Référence de commande', d.reference],
    ['Code de vérification', code],
    ['Client', d.nomClient],
    ['Produit', 'Prévisions annuelles 2027 (document et audios)'],
    ['Montant', `${d.montant.toLocaleString('fr-FR')} ${d.devise}`],
    ["Date d'émission", d.dateEmission.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })],
    ['Transaction FedaPay', d.numeroTransaction],
  ];
  let y = 700;
  for (const [label, valeur] of lignes) {
    page.drawText(label, { x: 50, y, size: 11, font: gras, color: gris });
    page.drawText(valeur, { x: 220, y, size: 11, font: police, color: rgb(0.1, 0.1, 0.1) });
    y -= 26;
  }
  const qr = await doc.embedPng(qrPng);
  page.drawImage(qr, { x: 50, y: 330, width: 160, height: 160 });
  page.drawText("Scannez ce code pour vérifier l'authenticité de ce reçu.", { x: 230, y: 420, size: 11, font: police, color: gris });
  page.drawText("Ce reçu atteste d'un paiement. Il ne constitue pas un avis professionnel.", { x: 50, y: 60, size: 9, font: police, color: gris });
  return { pdf: Buffer.from(await doc.save()), code };
}
