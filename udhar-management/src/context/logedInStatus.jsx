import React, { createContext } from "react";

function useCheckLogin() {
    const [loggedIn, setLoggedIn] = React.useState(false);

    const logIn = () => {
        setLoggedIn(true);
    }

    const logOut = () => {
        setLoggedIn(false);
    }
    return {
        loggedIn,
        logIn,
        logOut
    }
}

export const loggedInContext = createContext();

function LoggedInProvider({ children }) {
    const { loggedIn, logIn, logOut } = useCheckLogin();
    return (
        <loggedInContext.Provider value={{ loggedIn, logIn, logOut }}>
            {children}
        </loggedInContext.Provider>
    )
}

export default LoggedInProvider;