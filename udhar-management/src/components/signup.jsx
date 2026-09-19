import React, { useState } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const handlesignup = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            console.log(data);

            if (res.status === 201) {
                // TODO: Redirect to dashboard
                navigate("/login");
            } else {
                // TODO: Show error message
                alert("Error in creating account");
            }
        } catch (err) {
            console.log(err);
        }
    }
    return (
        <div className="signup-container">
            <h1>signup</h1>
            <form>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" onClick={handlesignup}>signup</button>
                <p className="link">Already have an account? <Link to="/login" className="link">Login</Link></p>
            </form>
        </div>
    );
}
export default Signup;