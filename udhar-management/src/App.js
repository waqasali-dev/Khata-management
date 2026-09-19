import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import { Link, Navigate } from 'react-router-dom';
import { loggedInContext } from './context/logedInStatus';

function App() {
  const { loggedIn } = useContext(loggedInContext) || { loggedIn: false };
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [contacts, setContacts] = useState([]);
  const [requested, setRequested] = useState([]);
  const [addUdhar, setAddUdhar] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");


  useEffect(() => {

  }, []);

  const handleSubmit = async (e) => {

  };

  const handleAddUdhar = (requested) => {


  }

  function updateContact(requested) {

  }

  if (!loggedIn) {
    return <Navigate to='/login' />
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="title">
          <nav>
            <Link to='/add_new_contact'>Add New Udhari</Link>
          </nav>
        </div>
      </header>
      <section className='body-section'>
        <h1>Search for Udhar</h1>
        <div className='input-fields'>
          <div>
            <input type="text" list="contacts" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <datalist id="contacts">
              {contacts.map((contact, index) => (
                <option key={index} value={contact.name} />
              ))}
            </datalist>
          </div>

          <div>
            <input type="text" list="identities" placeholder="Identity" value={identity} onChange={(e) => setIdentity(e.target.value)} />
            <datalist id="identities">
              {contacts.map((contact, index) => (
                <option key={index} value={contact.identity} />
              ))}
            </datalist>
          </div>
          <button id="submit" onClick={handleSubmit}>Submit</button>
        </div>

        <div>
          {requested.map((request, index) => (
            <div key={index}>
              <p>Name: {request.name}</p>
              <p>Identity: {request.identity}</p>
              <button onClick={() => setAddUdhar(true)}>Add Udhar</button>
              <p>Udhar History: {request.udhars.map((udhar, index) => (
                <div key={index} className="udhar-entry">
                  <p>Amount: {udhar.amount}</p>
                  <p>Type: {udhar.type}</p>
                  <p>Date: {udhar.date}</p>
                </div>
              ))}</p>
            </div>
          ))}
        </div>
      </section >
      {addUdhar && (
        <div className="add-udhar-overlay">
          <div className="add-udhar-card">
            <h2>Add Udhar</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-field">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="udhar">Udhar</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" onClick={() => handleAddUdhar(requested)} >Add Udhar</button>
                <button onClick={() => setAddUdhar(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )
      }
    </div >
  );
}

export default App;
