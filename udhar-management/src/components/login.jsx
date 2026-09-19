import React, { useState, useContext } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import { loggedInContext } from "../context/logedInStatus";

function Login() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const loginStatus = useContext(loggedInContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            console.log(data);

            if (res.status === 200) {
                loginStatus.setLoggedIn(true);
                // TODO: Redirect to dashboard
                navigate("/");
            } else {
                // TODO: Show error message
                alert("Invalid credentials");
            }
        } catch (err) {
            console.log(err);
        }
    }
    return (
        <div>
            <h1>Login</h1>
            <form>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" onClick={handleLogin}>Login</button>
                <p className="link">Don't have an account? <Link to="/signup" className="link">Sign Up</Link></p>
            </form>
        </div>
    );
}
export default Login;