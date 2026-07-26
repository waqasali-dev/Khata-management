import React, { useState, useEffect } from "react";
import "./newContact.css";

function NewContact() {
    const [name, setName] = useState("");
    const [identity, setIdentity] = useState("");
    const [contacts, setContacts] = useState([]);
    const [udhar, setUdhar] = useState("");
    const [submitState, setSubmitState] = useState("idle"); // idle | saving | success

    useEffect(() => {
        const fetchContact = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/contacts");
                const data = await response.json();
                setContacts(data);
            } catch (err) {
                console.log(err);
            }
        };
        fetchContact();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitState("saving");

        const newContact = {
            name: name,
            identity: identity,
            udhars: [
                {
                    amount: Number(udhar),
                    type: "udhar",
                    date: new Date().toISOString().split("T")[0],
                },
            ],
            amount: Number(udhar),
        };

        try {
            const response = await fetch("http://localhost:5000/api/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newContact),
            });

            if (response.ok) {
                const addedContact = await response.json();
                setContacts([...contacts, addedContact]);
                setSubmitState("success");

                setTimeout(() => {
                    setSubmitState("idle");
                    setName("");
                    setIdentity("");
                    setUdhar("");

                    // Bounce animation on list
                    const listCard = document.querySelector(".contacts-list-card");
                    if (listCard) {
                        listCard.classList.add("bounce");
                        setTimeout(() => listCard.classList.remove("bounce"), 400);
                    }
                }, 1500);
            }
        } catch (error) {
            console.error("Error connecting to server:", error);
            setSubmitState("idle");
        }
    };

    const handleClear = () => {
        setName("");
        setIdentity("");
        setUdhar("");
    };

    const getSubmitButtonText = () => {
        if (submitState === "saving") return "Saving...";
        if (submitState === "success") return "Success!";
        return "Submit Entry";
    };

    return (
        <div className="new-contact-page">
            <main className="new-contact-main">
                {/* LEFT COLUMN: Form */}
                <div className="form-column">
                    <div className="form-card">
                        <div className="form-card-header">
                            <h1>Add New Contact</h1>
                            <p>Create a new entry in your financial ledger.</p>
                        </div>

                        <form className="new-contact-form" onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label htmlFor="name">
                                    Name <span className="required-star">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Full name of person"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="identity">Identity</label>
                                <input
                                    id="identity"
                                    type="text"
                                    placeholder="Phone, Email, or Business ID"
                                    value={identity}
                                    onChange={(e) => setIdentity(e.target.value)}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="udhar">Udhar Amount</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-symbol">Rs. </span>
                                    <input
                                        id="udhar"
                                        type="number"
                                        placeholder="0.00"
                                        value={udhar}
                                        onChange={(e) => setUdhar(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className={`btn-submit ${submitState === "saving"
                                        ? "saving"
                                        : submitState === "success"
                                            ? "success"
                                            : ""
                                        }`}
                                    disabled={submitState !== "idle"}
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
                        <h2>Contacts Data from Server</h2>
                        <span className="contacts-count-badge">
                            {contacts.length} Total
                        </span>
                    </div>

                    <div className="contacts-list-card">
                        {contacts.length === 0 ? (
                            <div className="contacts-empty">
                                <div className="contacts-empty-icon">👤</div>
                                <p>Loading or no contacts found...</p>
                            </div>
                        ) : (
                            <ul className="contacts-list">
                                {contacts.map((contact, index) => (
                                    <li key={index} className="contact-item">
                                        <div className="contact-info">
                                            <div className="contact-avatar">
                                                {contact.name
                                                    ? contact.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)
                                                    : "?"}
                                            </div>
                                            <div className="contact-details">
                                                <p className="contact-name">
                                                    {contact.name}{" "}
                                                    {contact.identity && (
                                                        <span className="contact-identity-inline">
                                                            ({contact.identity})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="contact-amount-section">
                                            <p className="contact-amount-label">Udhar:</p>
                                            <p className="contact-amount-value">
                                                Rs.{" "}
                                                {Number(contact.amount).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default NewContact;