import { React, useState, useEffect } from 'react';
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [contacts, setContacts] = useState([]);
  const [requested, setRequested] = useState([]);

  useEffect(() => {
    const fetchCOntact = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/contacts");
        const data = await response.json();
        console.log("this is contacts", data);
        setContacts(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCOntact();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = contacts.filter((contacts) => contacts.name === name && contacts.identity === identity);
    if (result.length === 0) {
      alert("No contact found");
    } else {
      console.log(result);
      setRequested(result);
    }
  };

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
      </section>
    </div>
  );
}

export default App;
