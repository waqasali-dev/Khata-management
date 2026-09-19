import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loggedInContext } from '../context/logedInStatus';
import '../App.css';
import './newContact.css';

function NewContact() {
  const { loggedIn, user, logOut } = useContext(loggedInContext) || { loggedIn: false };
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [udhar, setUdhar] = useState('');
  const [type, setType] = useState('udhar');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | saving | success
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Fetch contacts for current user
  const fetchContacts = useCallback(async () => {
    if (!user?.user_id) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(`http://localhost:5000/api/contacts?user_id=${user.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (!loggedIn) {
      navigate('/login');
    } else {
      fetchContacts();
    }
  }, [loggedIn, navigate, fetchContacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Contact name is required.' });
      return;
    }

    setSubmitState('saving');
    try {
      const res = await fetch('http://localhost:5000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          name: name.trim(),
          identity: identity.trim(),
          amount: Number(udhar) || 0,
          type,
          date,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitState('success');
        setFeedback({
          type: 'success',
          message: `Contact "${name}" saved successfully!`,
        });

        // Refresh contacts list
        await fetchContacts();

        // Reset form after short delay
        setTimeout(() => {
          handleClear();
          setSubmitState('idle');
        }, 1200);
      } else {
        setSubmitState('idle');
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to save contact. Please try again.',
        });
      }
    } catch (err) {
      console.error('Error adding contact:', err);
      setSubmitState('idle');
      setFeedback({
        type: 'error',
        message: 'Network error: could not connect to server.',
      });
    }
  };

  const handleClear = () => {
    setName('');
    setIdentity('');
    setUdhar('');
    setType('udhar');
    setDate(new Date().toISOString().split('T')[0]);
    setFeedback({ type: '', message: '' });
  };

  const getSubmitButtonText = () => {
    if (submitState === 'saving') return 'Saving Contact...';
    if (submitState === 'success') return '✓ Saved Successfully!';
    return 'Save Contact';
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.identity && c.identity.toLowerCase().includes(q));
  });

  if (!loggedIn) {
    return null;
  }

  return (
    <div className="new-contact-page">
      {/* TOP NAVIGATION BAR */}
      <header className="App-header">
        <div className="title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ← Dashboard
            </Link>
            <span style={{ color: 'var(--outline-variant)' }}>|</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              Add New Contact
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
              Logged in as: <strong style={{ color: 'var(--primary)' }}>{user?.name || 'User'}</strong>
            </span>
            <button
              onClick={logOut}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--outline-variant)',
                borderRadius: '6px',
                color: 'var(--error)',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="new-contact-main">
        {/* LEFT COLUMN: Form */}
        <div className="form-column">
          <div className="form-card">
            <div className="form-card-header">
              <h1>Add New Contact</h1>
              <p>Create a new contact entry in your financial khata ledger.</p>
            </div>

            {feedback.message && (
              <div
                style={{
                  margin: '1rem 1.5rem 0 1.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: feedback.type === 'success' ? '#166534' : '#991b1b',
                  border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                {feedback.message}
              </div>
            )}

            <form className="new-contact-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="name">
                  Contact Name <span className="required-star">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Full name of person / business"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="identity">Identity / Note</label>
                <input
                  id="identity"
                  type="text"
                  placeholder="Phone, Address, or identifier"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="type">Transaction Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    height: '44px',
                    padding: '0 var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--outline-variant)',
                    outline: 'none',
                    fontSize: '14px',
                    color: 'var(--on-surface)',
                  }}
                >
                  <option value="udhar">Udhar Given (Customer owes you)</option>
                  <option value="payment">Advance Payment Received (Customer paid you)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="udhar">Initial Amount (Optional)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">Rs.</span>
                  <input
                    id="udhar"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={udhar}
                    onChange={(e) => setUdhar(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn-submit ${submitState === 'saving' ? 'saving' : submitState === 'success' ? 'success' : ''}`}
                  disabled={submitState !== 'idle'}
                >
                  {getSubmitButtonText()}
                </button>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={handleClear}
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Contacts List */}
        <div className="contacts-column">
          <div className="contacts-header">
            <h2>Your Existing Contacts</h2>
            <span className="contacts-count-badge">
              {contacts.length} Total
            </span>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search existing contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 1rem',
                borderRadius: '8px',
                border: '1px solid var(--outline-variant)',
                backgroundColor: 'var(--surface-container-lowest)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div className="contacts-list-card">
            {loadingContacts ? (
              <div className="contacts-loading">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="contacts-empty">
                <div className="contacts-empty-icon">👤</div>
                <p>
                  {contacts.length === 0
                    ? 'No contacts yet. Add your first contact using the form.'
                    : 'No matching contacts found.'}
                </p>
              </div>
            ) : (
              <ul className="contacts-list">
                {filteredContacts.map((contact, index) => {
                  const balance = Number(contact.amount);
                  const isSettled = balance === 0;
                  const isOwing = balance > 0;

                  return (
                    <li
                      key={index}
                      className="contact-item"
                      onClick={() => navigate('/', { state: { selectedContact: contact.name } })}
                      style={{ cursor: 'pointer' }}
                      title="Click to view full history on dashboard"
                    >
                      <div className="contact-info">
                        <div className="contact-avatar">
                          {contact.name
                            ? contact.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : '?'}
                        </div>
                        <div className="contact-details">
                          <p className="contact-name">
                            {contact.name}{' '}
                            {contact.identity && (
                              <span className="contact-identity-inline">
                                ({contact.identity})
                              </span>
                            )}
                          </p>
                          <p className="contact-meta">
                            {contact.udhars?.length || 0} transaction{(contact.udhars?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="contact-amount-section">
                        <p className="contact-amount-label">
                          {isSettled ? 'Balance' : isOwing ? 'Udhar (Pending)' : 'Advance Paid'}
                        </p>
                        <p
                          className={`contact-amount-value ${isSettled ? 'settled' : ''}`}
                          style={{
                            color: isSettled ? 'var(--outline)' : isOwing ? 'var(--error)' : '#16a34a',
                          }}
                        >
                          Rs.{' '}
                          {Math.abs(balance).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default NewContact;