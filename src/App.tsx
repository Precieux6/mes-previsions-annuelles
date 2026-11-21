import React, { useEffect, useState, useMemo } from 'react';
import Receipt, { type ReceiptData } from './components/Receipt';
import { analyserProfilClient, type ProfilSpirituel } from './lib/spiritualProfile';

export const SIGNES_INFOS = [
  { id: 'belier', nom: 'Bélier', symbole: '♈', dates: '21 mars – 19 avril' },
  { id: 'taureau', nom: 'Taureau', symbole: '♉', dates: '20 avril – 20 mai' },
  { id: 'gemeaux', nom: 'Gémeaux', symbole: '♊', dates: '21 mai – 20 juin' },
  { id: 'cancer', nom: 'Cancer', symbole: '♋', dates: '21 juin – 22 juillet' },
  { id: 'lion', nom: 'Lion', symbole: '♌', dates: '23 juillet – 22 août' },
  { id: 'vierge', nom: 'Vierge', symbole: '♍', dates: '23 août – 22 septembre' },
  { id: 'balance', nom: 'Balance', symbole: '♎', dates: '23 septembre – 22 octobre' },
  { id: 'scorpion', nom: 'Scorpion', symbole: '♏', dates: '23 octobre – 21 novembre' },
  { id: 'sagittaire', nom: 'Sagittaire', symbole: '♐', dates: '22 novembre – 21 décembre' },
  { id: 'capricorne', nom: 'Capricorne', symbole: '♑', dates: '22 décembre – 19 janvier' },
  { id: 'verseau', nom: 'Verseau', symbole: '♒', dates: '20 janvier – 18 février' },
  { id: 'poissons', nom: 'Poissons', symbole: '♓', dates: '19 février – 20 mars' },
];

/** Calcule automatiquement le signe du zodiaque à partir de la date ISO YYYY-MM-DD */
function getZodiacSign(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'cancer';
  const parts = dateStr.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'belier';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taureau';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemeaux';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'lion';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'vierge';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'balance';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpion';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittaire';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorne';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'verseau';
  return 'poissons';
}

/** Formulaire en cartes dynamiques séquentielles */
function CommandeWizard() {
  const [step, setStep] = useState<number>(1);
  const [fullName, setFullName] = useState<string>(() => localStorage.getItem('mpa_draft_name') || '');
  const [birthdate, setBirthdate] = useState<string>(() => localStorage.getItem('mpa_draft_birth') || '');
  const [signId, setSignId] = useState<string>('cancer');
  const [consent, setConsent] = useState<boolean>(true);
  const [phone, setPhone] = useState<string>(() => localStorage.getItem('mpa_draft_phone') || '');
  const [email, setEmail] = useState<string>(() => localStorage.getItem('mpa_draft_email') || '');
  const [paymentPhone, setPaymentPhone] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');
  const [envoi, setEnvoi] = useState<boolean>(false);

  // Sauvegarde automatique des brouillons
  useEffect(() => {
    localStorage.setItem('mpa_draft_name', fullName);
  }, [fullName]);
  useEffect(() => {
    localStorage.setItem('mpa_draft_birth', birthdate);
  }, [birthdate]);
  useEffect(() => {
    localStorage.setItem('mpa_draft_phone', phone);
  }, [phone]);
  useEffect(() => {
    localStorage.setItem('mpa_draft_email', email);
  }, [email]);

  // Synchronisation automatique du numéro de paiement avec le téléphone de contact
  useEffect(() => {
    if (phone && !paymentPhone) {
      setPaymentPhone(phone);
    }
  }, [phone, paymentPhone]);

  // Détection automatique du signe à la sélection d'une date de naissance
  const handleDateChange = (val: string) => {
    setBirthdate(val);
    if (val) {
      const calculatedSign = getZodiacSign(val);
      setSignId(calculatedSign);
    }
  };

  const currentSign = useMemo(() => {
    return SIGNES_INFOS.find((s) => s.id === signId) || SIGNES_INFOS[3]; // Cancer par défaut
  }, [signId]);

  const spiritualProfile = useMemo(() => {
    return birthdate ? analyserProfilClient(birthdate) : null;
  }, [birthdate]);

  // Validation par étape
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErreur('Merci de renseigner votre nom et prénoms complets.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErreur('');
    if (birthdate && !consent) {
      setErreur('Merci de confirmer votre accord pour l’utilisation de votre date de naissance.');
      return;
    }
    setStep(3);
  };

  const handleSkipStep2 = () => {
    setBirthdate('');
    setErreur('');
    setStep(3);
  };

  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErreur('Merci de renseigner un numéro de téléphone valide pour le suivi et le paiement.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur('Merci de renseigner une adresse e-mail valide.');
      return;
    }
    if (!paymentPhone) {
      setPaymentPhone(phone);
    }
    setStep(4);
  };

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);

    try {
      const contactVal = `${phone.trim()} · ${email.trim()}`.slice(0, 120);
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          birthdate: birthdate || undefined,
          signId: birthdate ? signId : undefined,
          phone: phone.trim(),
          email: email.trim(),
          paymentPhone: (paymentPhone || phone).trim(),
          contact: contactVal,
        }),
      });

      // Gestion robuste des réponses même en cas de retour non-JSON
      const text = await r.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Une erreur serveur est survenue. Veuillez vérifier la connexion ou réessayer dans un instant.');
      }

      if (!r.ok) {
        throw new Error(data.error || 'Erreur inattendue.');
      }

      if (!data.paymentUrl) {
        throw new Error("L'adresse de paiement FedaPay n'a pas été fournie.");
      }

      // Sauvegarde des identifiants locaux
      localStorage.setItem(`mpa_token_${data.reference}`, data.accessToken);
      localStorage.setItem('mpa_last_ref', data.reference);

      // Redirection immédiate vers la page sécurisée de paiement FedaPay
      window.location.href = data.paymentUrl;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur de connexion. Veuillez réessayer.');
      setEnvoi(false);
    }
  };

  const stepsLabels = ['Identité', 'Date de naissance', 'Coordonnées', 'Paiement'];

  return (
    <div className="app-container">
      {/* Barre de navigation des étapes */}
      <div className="wizard-progress-card">
        <div className="wizard-steps-nav">
          {stepsLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            return (
              <button
                type="button"
                key={label}
                className={`wizard-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (isCompleted) setStep(stepNum);
                }}
              >
                <div className="wizard-step-circle">
                  {isCompleted ? '✓' : stepNum}
                </div>
                <span className="wizard-step-label">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-bar"
            style={{ width: `${((step - 1) / (stepsLabels.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* CARTE 1 : NOM & PRÉNOMS */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} className="step-card">
          <div className="step-card-header">
            <span className="step-badge">Étape 1 sur 4</span>
            <h2 className="step-card-title">Votre nom et prénoms</h2>
            <p className="step-card-desc">
              Ces informations permettront d'éditer personnellement votre étude des prévisions 2027 et votre reçu de paiement.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Nom et prénoms complets
            </label>
            <input
              id="fullName"
              required
              autoFocus
              type="text"
              placeholder="Ex. TOSSOU Précieux Trésor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
            />
            <p className="form-hint">Veuillez inscrire vos noms tels que vous souhaitez les voir figurer sur vos documents.</p>
          </div>

          {erreur && <p className="form-error-msg">⚠️ {erreur}</p>}

          <div className="step-actions">
            <div />
            <button type="submit" className="btn btn-primary">
              Suivant : Date de naissance →
            </button>
          </div>
        </form>
      )}

      {/* CARTE 2 : DATE DE NAISSANCE (FACULTATIVE) */}
      {step === 2 && (
        <form onSubmit={handleNextStep2} className="step-card">
          <div className="step-card-header">
            <span className="step-badge">Étape 2 sur 4</span>
            <h2 className="step-card-title">Date de naissance</h2>
            <p className="step-card-desc">
              Cette étape est facultative. Elle permet d'affiner l'étude avec le calcul de votre année personnelle et de vos transits astrologiques pour 2027.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="birthdate">
              Date de naissance <span className="optional">(facultative)</span>
            </label>
            <input
              id="birthdate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={birthdate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="form-input"
            />
          </div>

          {birthdate && (
            <>
              <div className="zodiac-preview-box">
                <div className="zodiac-info">
                  <span className="zodiac-icon">{currentSign.symbole}</span>
                  <div className="zodiac-text">
                    <strong>Signe solaire : {currentSign.nom}</strong>
                    <span>Période : {currentSign.dates}</span>
                  </div>
                </div>
                <select
                  value={signId}
                  onChange={(e) => setSignId(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                >
                  {SIGNES_INFOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.symbole} {s.nom}
                    </option>
                  ))}
                </select>
              </div>

              <label className="consent-label">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="consent-checkbox"
                />
                <span>
                  J’accepte que ma date de naissance soit utilisée uniquement pour calculer mon année personnelle et les repères astrologiques de mon étude annuelle 2027.
                </span>
              </label>

              {spiritualProfile && (
                <div style={{ marginTop: '14px', background: '#fdfcf7', border: '1px solid #f0deb0', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.88rem', color: '#78350f', fontWeight: 'bold', marginBottom: '6px' }}>
                    ✨ Géomancie Fâ : {spiritualProfile.signe_medji.nom}
                  </div>
                  <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#92400e', marginBottom: '8px' }}>
                    « {spiritualProfile.signe_medji.titre} »
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#451a03', lineHeight: 1.5 }}>
                    Né(e) un <strong>{spiritualProfile.jour_semaine}</strong> sous l'Archange <strong>{spiritualProfile.archange}</strong> ({spiritualProfile.planete_regente}) · Chemin de Vie <strong>{spiritualProfile.chemin_de_vie}</strong> · Couleurs de chance : <strong>{spiritualProfile.couleurs_chance.join(', ')}</strong>
                  </div>
                </div>
              )}
            </>
          )}

          {erreur && <p className="form-error-msg">⚠️ {erreur}</p>}

          <div className="step-actions">
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
              ← Précédent
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!birthdate && (
                <button type="button" onClick={handleSkipStep2} className="btn-skip">
                  Passer cette étape
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                Suivant : Coordonnées →
              </button>
            </div>
          </div>
        </form>
      )}

      {/* CARTE 3 : COORDONNÉES */}
      {step === 3 && (
        <form onSubmit={handleNextStep3} className="step-card">
          <div className="step-card-header">
            <span className="step-badge">Étape 3 sur 4</span>
            <h2 className="step-card-title">Vos coordonnées de contact</h2>
            <p className="step-card-desc">
              Où souhaitez-vous recevoir votre reçu de paiement ainsi que les notifications pour vos documents ?
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Numéro de téléphone (Mobile Money / WhatsApp)
            </label>
            <input
              id="phone"
              required
              type="tel"
              placeholder="+229 01 42 52 42 83"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
            />
            <p className="form-hint">Numéro joignable avec indicatif pays (+229 pour le Bénin).</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              required
              type="email"
              placeholder="exemple@domaine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          {erreur && <p className="form-error-msg">⚠️ {erreur}</p>}

          <div className="step-actions">
            <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
              ← Précédent
            </button>
            <button type="submit" className="btn btn-primary">
              Suivant : Paiement →
            </button>
          </div>
        </form>
      )}

      {/* CARTE 4 : RÉCAPITULATIF & PAIEMENT */}
      {step === 4 && (
        <form onSubmit={handleSoumettre} className="step-card">
          <div className="step-card-header">
            <span className="step-badge">Étape 4 sur 4</span>
            <h2 className="step-card-title">Confirmation & Paiement</h2>
            <p className="step-card-desc">
              Vérifiez vos informations ci-dessous avant d'engager le règlement sécurisé.
            </p>
          </div>

          <div className="summary-card">
            <div className="summary-title">Récapitulatif de votre commande</div>
            <div className="summary-row">
              <span className="summary-label">Prestation</span>
              <span className="summary-value">Prévision annuelle 2027</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Auteur</span>
              <span className="summary-value">Monsieur Folly Valère TOSSOU</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Destinataire</span>
              <span className="summary-value">{fullName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Date de naissance</span>
              <span className="summary-value">
                {birthdate ? `${birthdate} (${currentSign.symbole} ${currentSign.nom})` : 'Non renseignée (Mode nom seul)'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Téléphone</span>
              <span className="summary-value">{phone}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">E-mail</span>
              <span className="summary-value">{email}</span>
            </div>
            <div className="summary-total">
              <span className="summary-label">Total à régler</span>
              <span className="summary-value">5 000 XOF</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="paymentPhone">
              Numéro servant au paiement Mobile Money
            </label>
            <input
              id="paymentPhone"
              required
              type="tel"
              placeholder="+229 ..."
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              className="form-input"
            />
            <p className="form-hint">
              Le paiement est déclenché sur ce numéro. Vous recevrez une demande de confirmation Mobile Money (MTN, Moov, Celtiis).
            </p>
          </div>

          {erreur && <p className="form-error-msg">⚠️ {erreur}</p>}

          <div className="step-actions">
            <button type="button" onClick={() => setStep(3)} className="btn btn-secondary" disabled={envoi}>
              ← Modifier
            </button>
            <button type="submit" disabled={envoi} className="btn btn-primary">
              {envoi ? 'Connexion à FedaPay…' : 'Procéder au paiement (5 000 XOF)'}
            </button>
          </div>

          <div className="security-badge">
            🔒 Paiement 100% sécurisé via FedaPay. Aucune coordonnée bancaire n'est stockée sur notre site.
          </div>
        </form>
      )}
    </div>
  );
}

/** Écran de suivi et affichage du reçu officiel après paiement */
function Suivi({ reference }: { reference: string }) {
  const [order, setOrder] = useState<any>(null);
  const [documents, setDocuments] = useState<Array<{ doc_type: string }>>([]);
  const [erreur, setErreur] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const jeton = localStorage.getItem(`mpa_token_${reference}`) ?? '';

  useEffect(() => {
    if (!jeton) {
      setErreur('Jeton de commande introuvable sur cet appareil.');
      setLoading(false);
      return;
    }

    let arret = false;

    async function chargerStatut() {
      try {
        const r = await fetch(`/api/status?ref=${encodeURIComponent(reference)}`, {
          headers: { Authorization: `Bearer ${jeton}` },
        });
        const data = await r.json();
        if (!r.ok) {
          setErreur(data.error || 'Impossible de charger le statut de la commande.');
          setLoading(false);
          return;
        }

        setOrder(data.order);
        setDocuments(data.documents || []);
        setLoading(false);

        // Si la commande n'est pas encore terminée, on vérifie à nouveau
        if (!arret && !['completed', 'failed'].includes(data.order?.status)) {
          setTimeout(chargerStatut, 4000);
        }
      } catch (e) {
        setErreur('Erreur de connexion lors du suivi.');
        setLoading(false);
      }
    }

    chargerStatut();
    return () => {
      arret = true;
    };
  }, [reference, jeton]);

  async function telechargerDocument(type: string) {
    const r = await fetch(`/api/files?ref=${encodeURIComponent(reference)}&type=${type}`, {
      headers: { Authorization: `Bearer ${jeton}` },
    });
    if (r.redirected) {
      window.open(r.url, '_blank');
    } else {
      alert(`Téléchargement en cours de préparation (${r.status}).`);
    }
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="step-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>Vérification du paiement en cours…</p>
          <p className="form-hint" style={{ marginTop: '8px' }}>Veuillez patienter quelques instants.</p>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="app-container">
        <div className="step-card">
          <h2 className="step-card-title" style={{ color: 'var(--danger)' }}>Information</h2>
          <p style={{ margin: '14px 0' }}>{erreur}</p>
          <a href="/" className="btn btn-secondary">Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  // Découpage du nom
  const parts = String(order?.full_name || '').trim().split(/\s+/);
  const nomFamille = parts[0] || 'TOSSOU';
  const prenoms = parts.slice(1).join(' ') || '';

  // Extraction contact
  const contactParts = String(order?.contact || '').split('·');
  const telephone = contactParts[0]?.trim() || '';
  const email = contactParts[1]?.trim() || '';

  const dateFormatee = order?.paid_at
    ? new Date(order.paid_at).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const receiptData: ReceiptData = {
    reference: order?.reference || reference,
    eventName: 'Prévision annuelle 2027',
    date: dateFormatee,
    lastName: nomFamille,
    firstName: prenoms,
    phone: telephone,
    email: email,
    birthdate: order?.birthdate ? String(order.birthdate).slice(0, 10) : undefined,
    sign: order?.sign_id && order.sign_id !== 'nom_seul' ? order.sign_id : undefined,
    prestation: 'Prévision annuelle 2027',
    total: Number(order?.amount || 5000),
    verifyUrl: `${window.location.origin}/suivi?ref=${order?.reference || reference}`,
    organizer: 'Monsieur Folly Valère TOSSOU',
    signatureText: 'A votre service...',
  };

  const isPaid = ['paid', 'completed'].includes(order?.status);

  const orderSpiritualProfile = useMemo(() => {
    return order?.birthdate ? analyserProfilClient(String(order.birthdate).slice(0, 10)) : null;
  }, [order?.birthdate]);

  return (
    <div className="app-container">
      {isPaid ? (
        <>
          <div className="step-card" style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span className="status-badge paid">✓ Paiement confirmé</span>
            <h2 className="step-card-title">Merci pour votre confiance !</h2>
            <p className="step-card-desc">
              Votre commande est enregistrée. Vous pouvez dès maintenant télécharger votre reçu officiel ci-dessous.
            </p>
          </div>

          {/* COMPOSANT REÇU OFFICIEL (Conforme Capture 3) */}
          <Receipt d={receiptData} />

          {/* CARTE DE RÉVÉLATION SPIRITUELLE & GÉOMANCIE FÂ */}
          {orderSpiritualProfile && (
            <div className="spiritual-revelation-card">
              <span className="spiritual-badge">Révélation Ancestrale & Fâ 2027</span>
              <h3 className="spiritual-title">
                Signe Mêdji : {orderSpiritualProfile.signe_medji.nom}
              </h3>
              <p className="spiritual-subtitle">« {orderSpiritualProfile.signe_medji.titre} »</p>

              <div className="spiritual-prophecy">
                <p><strong>Prophétie de naissance :</strong> {orderSpiritualProfile.signe_medji.prophetie}</p>
                <p style={{ marginTop: '10px' }}><strong>Guidance pour 2027 :</strong> {orderSpiritualProfile.signe_medji.conseil_2027}</p>
              </div>

              <div className="spiritual-grid">
                <div className="spiritual-box">
                  <span className="spiritual-box-title">Jour & Archange Régent</span>
                  <strong>{orderSpiritualProfile.jour_semaine} · Archange {orderSpiritualProfile.archange}</strong>
                  <p className="form-hint">
                    Planète : {orderSpiritualProfile.planete_regente ?? '–'}
                    {orderSpiritualProfile.divinite_protectrice && <> · Force : {orderSpiritualProfile.divinite_protectrice}</>}
                  </p>
                </div>
                {orderSpiritualProfile.psaume && (
                <div className="spiritual-box">
                  <span className="spiritual-box-title">Psaume d'Autorité</span>
                  <strong>{orderSpiritualProfile.psaume}</strong>
                  <p className="form-hint">À méditer régulièrement pour activer vos bénédictions en 2027.</p>
                </div>
              )}
                <div className="spiritual-box">
                  <span className="spiritual-box-title">Couleurs & Animal Alliés</span>
                  <strong>{orderSpiritualProfile.couleurs_chance.join(', ')}</strong>
                  <p className="form-hint">Animal porte-bonheur : {orderSpiritualProfile.animal_porte_bonheur}</p>
                </div>
                <div className="spiritual-box">
                  <span className="spiritual-box-title">Chemin de Vie Numérologique</span>
                  <strong>Chemin de Vie {orderSpiritualProfile.chemin_de_vie}</strong>
                  <p className="form-hint">Vibration en harmonie avec l'Année Universelle 11/2 en 2027.</p>
                </div>
              </div>

              <div className="spiritual-warnings">
                <h4>⚠️ Interdictions sacrées pour préserver votre chance :</h4>
                <ul>
                  {orderSpiritualProfile.interdictions.map((inter, i) => (
                    <li key={i}>{inter}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Statut de génération de l'étude (PDF 36 pages + Audios) */}
          <div className="status-card">
            <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '10px' }}>
              Vos documents personnalisés
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '14px' }}>
              Statut de préparation : <strong>{order?.status === 'completed' ? 'Prêt' : 'En cours d\'assemblage'}</strong>
            </p>

            <ul className="doc-list">
              <li className="doc-item">
                <div>
                  <strong>Document d'étude complet (PDF 36 pages)</strong>
                  <p className="form-hint">Grandes tendances 2027, prévisions mensuelles et conseils</p>
                </div>
                {documents.some((d) => d.doc_type === 'pdf_36_pages') ? (
                  <button onClick={() => telechargerDocument('pdf_36_pages')} className="btn btn-secondary">
                    Télécharger
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Génération en cours…</span>
                )}
              </li>

              {documents
                .filter((d) => d.doc_type.startsWith('audio_'))
                .map((d) => (
                  <li className="doc-item" key={d.doc_type}>
                    <div>
                      <strong>Piste audio : {d.doc_type}</strong>
                    </div>
                    <button onClick={() => telechargerDocument(d.doc_type)} className="btn btn-secondary">
                      Écouter / Télécharger
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="step-card" style={{ textAlign: 'center' }}>
          <span className="status-badge processing">⏳ Paiement en attente</span>
          <h2 className="step-card-title">En attente de confirmation</h2>
          <p className="step-card-desc" style={{ margin: '14px 0' }}>
            Si vous venez de valider votre transaction Mobile Money ou carte bancaire, patientez quelques instants pendant la synchronisation.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Actualiser le statut
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const isSuivi = window.location.pathname.startsWith('/suivi');
  const ref = new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('mpa_last_ref') || '';

  return (
    <>
      <header className="app-header">
        <div className="app-brand">
          <span>✨</span>
          <span>Cabinet d'Études Astrologiques 2027</span>
        </div>
        <h1 className="app-title">Mes Prévisions Annuelles 2027</h1>
        <p className="app-subtitle">
          Par Monsieur Folly Valère TOSSOU — Votre étude personnelle détaillée pour aborder sereinement l'année 2027.
        </p>
      </header>

      <main>
        {isSuivi && ref ? <Suivi reference={ref} /> : <CommandeWizard />}
      </main>
    </>
  );
}
