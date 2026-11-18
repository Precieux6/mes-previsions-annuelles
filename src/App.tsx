import React, { useEffect, useState } from 'react';

const SIGNES = ['belier', 'taureau', 'gemeaux', 'cancer', 'lion', 'vierge',
  'balance', 'scorpion', 'sagittaire', 'capricorne', 'verseau', 'poissons'];

/** Formulaire : nom complet obligatoire ; date de naissance facultative (avec consentement). */
function Commande() {
  const [fullName, setFullName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [signId, setSignId] = useState('belier');
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    if (birthdate && !consent) {
      setErreur('Merci de confirmer votre accord pour l’utilisation de votre date de naissance.');
      return;
    }
    setEnvoi(true);
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, birthdate: birthdate || undefined, signId: birthdate ? signId : undefined, contact }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Erreur inattendue.');
      localStorage.setItem(`mpa_token_${data.reference}`, data.accessToken);
      localStorage.setItem('mpa_last_ref', data.reference);
      window.location.href = data.paymentUrl;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inattendue.');
      setEnvoi(false);
    }
  }

  return (
    <div className="page">
      <form className="card" onSubmit={soumettre}>
        <h1>Mes prévisions annuelles 2027</h1>

        <label className="field">Nom et prénoms complets
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>

        <label className="field">Date de naissance (facultative)
          <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
        </label>

        {birthdate && (
          <>
            <label className="field">Signe
              <select value={signId} onChange={(e) => setSignId(e.target.value)}>
                {SIGNES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>J’accepte que ma date de naissance soit utilisée uniquement pour calculer mon année personnelle et les repères astrologiques de mon étude.</span>
            </label>
          </>
        )}

        <label className="field">E-mail ou téléphone
          <input required value={contact} onChange={(e) => setContact(e.target.value)} />
        </label>

        {erreur && <p role="alert" className="erreur">{erreur}</p>}

        <button className="btn" disabled={envoi}>
          {envoi ? 'Redirection vers le paiement…' : 'Procéder au paiement (5 000 XOF)'}
        </button>
        <p className="note">Le paiement est traité par FedaPay. Aucune donnée de carte n’est saisie sur ce site.</p>
      </form>
    </div>
  );
}

/** Suivi : la commande est retrouvée avec la référence et le jeton stocké sur cet appareil. */
function Suivi({ reference }: { reference: string }) {
  const [statut, setStatut] = useState('');
  const [docs, setDocs] = useState<string[]>([]);
  const [erreur, setErreur] = useState('');
  const jeton = localStorage.getItem(`mpa_token_${reference}`) ?? '';

  useEffect(() => {
    if (!jeton) { setErreur('Jeton introuvable sur cet appareil.'); return; }
    let arret = false;
    async function verifier() {
      const r = await fetch(`/api/status?ref=${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${jeton}` } });
      const data = await r.json();
      if (!r.ok) { setErreur(data.error ?? 'Erreur.'); return; }
      setStatut(data.order.status);
      setDocs((data.documents as Array<{ doc_type: string }>).map((d) => d.doc_type));
      if (!arret && !['completed', 'failed'].includes(data.order.status)) setTimeout(verifier, 5000);
    }
    verifier();
    return () => { arret = true; };
  }, [reference]);

  async function ouvrir(type: string) {
    const r = await fetch(`/api/files?ref=${encodeURIComponent(reference)}&type=${type}`, { headers: { Authorization: `Bearer ${jeton}` } });
    if (r.redirected) window.open(r.url, '_blank');
    else setErreur(`Téléchargement impossible (${r.status}).`);
  }

  if (erreur) return <div className="suivi"><p className="erreur">{erreur}</p></div>;
  return (
    <div className="suivi">
      <h1>Suivi de commande {reference}</h1>
      <p>Statut : {statut || '…'}</p>
      {statut === 'completed' && (
        <ul>
          {docs.includes('pdf_36_pages') && <li><button className="lien" onClick={() => ouvrir('pdf_36_pages')}>Télécharger le document (PDF)</button></li>}
          {docs.includes('receipt_pdf') && <li><button className="lien" onClick={() => ouvrir('receipt_pdf')}>Télécharger le reçu</button></li>}
          {docs.filter((d) => d.startsWith('audio_')).map((d) => (
            <li key={d}><button className="lien" onClick={() => ouvrir(d)}>Écouter / télécharger {d}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  if (window.location.pathname.startsWith('/suivi')) {
    const ref = new URLSearchParams(window.location.search).get('ref') ?? localStorage.getItem('mpa_last_ref') ?? '';
    return <Suivi reference={ref} />;
  }
  return <Commande />;
}
