import React, { useState, useEffect, useContext, useCallback } from 'react';
import './App.css';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { loggedInContext } from './context/logedInStatus';

function App() {
  const { loggedIn, user, logOut } = useContext(loggedInContext) || { loggedIn: false };
  const location = useLocation();

  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [summary, setSummary] = useState({
    totalUdhar: 0,
    totalPayment: 0,
    netBalance: 0,
    totalContacts: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalContact, setModalContact] = useState({ name: '', identity: '' });
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('udhar');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch contacts and ledger summary
  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [contactsRes, summaryRes] = await Promise.all([
        fetch(`http://localhost:5000/api/contacts?user_id=${user.user_id}`),
        fetch(`http://localhost:5000/api/summary?user_id=${user.user_id}`),
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);

        // If navigated with a preselected contact from NewContact
        const selected = location.state?.selectedContact;
        if (selected) {
          setName(selected);
          setFilteredContacts(
            contactsData.filter((c) => c.name.toLowerCase().includes(selected.toLowerCase()))
          );
        } else {
          setFilteredContacts(contactsData);
        }
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, location.state?.selectedContact]);

  useEffect(() => {
    if (loggedIn && user?.user_id) {
      fetchData();
    }
  }, [loggedIn, user?.user_id, fetchData]);

  // Search Submit Handler
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    let result = [...contacts];

    if (name.trim()) {
      const qName = name.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(qName));
    }

    if (identity.trim()) {
      const qIdentity = identity.trim().toLowerCase();
      result = result.filter((c) => (c.identity || '').toLowerCase().includes(qIdentity));
    }

    setFilteredContacts(result);
  };

  const handleResetSearch = () => {
    setName('');
    setIdentity('');
    setFilteredContacts(contacts);
  };

  // Open Modal for a specific contact
  const handleOpenAddUdhar = (contact) => {
    setModalContact({
      name: contact ? contact.name : '',
      identity: contact ? contact.identity : '',
    });
    setAmount('');
    setType('udhar');
    setDate(new Date().toISOString().split('T')[0]);
    setModalError('');
    setShowModal(true);
  };

  // Submit Modal Transaction
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setModalError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setModalError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!modalContact.name.trim()) {
      setModalError('Contact name is required.');
      return;
    }

    setModalSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/udhar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          name: modalContact.name.trim(),
          identity: (modalContact.identity || '').trim(),
          amount: numAmount,
          type,
          date,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(false);
        await fetchData();
      } else {
        setModalError(data.error || 'Failed to save transaction.');
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      setModalError('Network error: Could not connect to server.');
    } finally {
      setModalSaving(false);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (udharId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/udhar/${udharId}?user_id=${user.user_id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to delete transaction.');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Error deleting transaction.');
    }
  };

  // Delete entire Contact
  const handleDeleteContact = async (contactName, contactIdentity) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${contactName}" and all associated transaction records?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          name: contactName,
          identity: contactIdentity,
        }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to delete contact.');
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="App">
      {/* HEADER / TOP NAV */}
      <header className="App-header">
        <div className="title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              Udhar Tracker
            </span>
          </div>

          <nav>
            <Link to="/add_new_contact">+ Add New Contact</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                Hi, <strong>{user?.name}</strong>
              </span>
              <button
                onClick={logOut}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--error)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* BODY CONTENT */}
      <section className="body-section">
        <h1>Search & Manage Udhar</h1>

        {/* STATS OVERVIEW CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Udhar Given
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)', marginTop: '0.35rem' }}>
              Rs. {summary.totalUdhar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Payments Received
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a', marginTop: '0.35rem' }}>
              Rs. {summary.totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>
              Net Balance Outstanding
            </p>
            <p
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: summary.netBalance > 0 ? 'var(--error)' : summary.netBalance < 0 ? '#16a34a' : 'var(--on-surface)',
                marginTop: '0.35rem',
              }}
            >
              Rs. {summary.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Contacts
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '0.35rem' }}>
              {summary.totalContacts} Contacts
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form className="input-fields" onSubmit={handleSearch}>
          <div>
            <input
              type="text"
              list="contacts"
              placeholder="Filter by contact name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <datalist id="contacts">
              {contacts.map((contact, index) => (
                <option key={index} value={contact.name} />
              ))}
            </datalist>
          </div>

          <div>
            <input
              type="text"
              list="identities"
              placeholder="Filter by phone or note"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
            <datalist id="identities">
              {contacts
                .filter((c) => c.identity)
                .map((contact, index) => (
                  <option key={index} value={contact.identity} />
                ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button id="submit" type="submit">
              Search
            </button>
            {(name || identity || filteredContacts.length !== contacts.length) && (
              <button
                type="button"
                onClick={handleResetSearch}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--on-surface-variant)',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* RESULTS SECTION */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
              Loading ledger records...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-xl)',
                border: '2px dashed var(--outline-variant)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {contacts.length === 0 ? 'No Udhar records found' : 'No matching contacts found'}
              </h3>
              <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
                {contacts.length === 0
                  ? 'Start by creating your first contact to track debts and payments.'
                  : 'Try changing your search filters or click Reset.'}
              </p>
              {contacts.length === 0 ? (
                <Link
                  to="/add_new_contact"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  + Add New Contact
                </Link>
              ) : (
                <button
                  onClick={handleResetSearch}
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Show All Contacts
                </button>
              )}
            </div>
          ) : (
            filteredContacts.map((contact, index) => {
              const initials = contact.name
                ? contact.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?';
              const balance = Number(contact.amount);

              return (
                <div key={index} style={{ marginBottom: '1.5rem' }}>
                  {/* CONTACT HEADER */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      backgroundColor: 'var(--surface)',
                      borderBottom: '1px solid var(--outline-variant)',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--primary-container)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                          {contact.name}
                        </h2>
                        {contact.identity && (
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                            Note/Identity: <strong>{contact.identity}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                          Current Net Balance:
                        </span>
                        <div
                          style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color: balance > 0 ? 'var(--error)' : balance < 0 ? '#16a34a' : 'var(--outline)',
                          }}
                        >
                          Rs. {Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span style={{ fontSize: '0.8rem', marginLeft: '6px', fontWeight: 500 }}>
                            {balance > 0 ? '(Owes You)' : balance < 0 ? '(Advance Paid)' : '(Settled)'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAddUdhar(contact)}
                        style={{
                          backgroundColor: 'var(--secondary)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.55rem 1rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        + Add Entry
                      </button>

                      <button
                        onClick={() => handleDeleteContact(contact.name, contact.identity)}
                        title="Delete this contact and all history"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--error)',
                          border: '1px solid var(--outline-variant)',
                          padding: '0.55rem 0.8rem',
                          borderRadius: '8px',
                          fontWeight: 500,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* TRANSACTION HISTORY */}
                  <div style={{ padding: '1rem 1.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--outline)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Ledger History ({contact.udhars?.length || 0})
                      </h4>
                    </div>

                    {contact.udhars && contact.udhars.length > 0 ? (
                      <div>
                        {contact.udhars.map((udharItem, uIdx) => (
                          <div
                            key={uIdx}
                            className="udhar-entry"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.2fr 1fr 1fr auto',
                              gap: '1rem',
                              alignItems: 'center',
                              padding: '0.75rem 0',
                              borderBottom: '1px solid var(--outline-variant)',
                            }}
                          >
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                              Rs. {Number(udharItem.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <div style={{ margin: 0 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  backgroundColor: udharItem.type === 'udhar' ? '#fee2e2' : '#dcfce7',
                                  color: udharItem.type === 'udhar' ? '#991b1b' : '#166534',
                                }}
                              >
                                {udharItem.type === 'udhar' ? 'Udhar Given' : 'Payment Received'}
                              </span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                              {udharItem.date}
                            </p>
                            <div>
                              <button
                                onClick={() => handleDeleteTransaction(udharItem.udhar_id)}
                                title="Delete entry"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--error)',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                ✕ Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
                        No transactions recorded for this contact yet. Click "+ Add Entry" above to add one.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ADD UDHAR / PAYMENT MODAL */}
      {showModal && (
        <div className="add-udhar-overlay" onClick={() => setShowModal(false)}>
          <div className="add-udhar-card" onClick={(e) => e.stopPropagation()}>
            <h2>Record Transaction</h2>
            <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Add a new debit or credit entry for <strong>{modalContact.name}</strong>
            </p>

            {modalError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveTransaction}>
              <div className="form-field">
                <label htmlFor="modal-type">Transaction Type</label>
                <select
                  id="modal-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface)',
                    fontSize: '14px',
                    color: 'var(--on-surface)',
                    outline: 'none',
                  }}
                  required
                >
                  <option value="udhar">Udhar (Customer took debt)</option>
                  <option value="payment">Payment (Customer paid back)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="amount">Amount (Rs.)</label>
                <input
                  type="number"
                  id="amount"
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="date">Transaction Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={modalSaving}
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: '#fff',
                  }}
                >
                  {modalSaving ? 'Saving...' : 'Save Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--outline-variant)',
                    color: 'var(--on-surface)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
