import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useEffect, useState } from "react";
import { User } from "../types";
function App() {

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    window.agent.getState().then((state) => {
      console.log("THE STATE", state)
      setUser(state.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    
      <Routes>
 
        <Route
          path="/login"
          element={<Login onLoginSuccess={(user) => setUser(user)} />}
        />


        <Route
          path="/"
          element={
            user && user.jwt ? (
              <Dashboard user={user} onLogoutSuccess={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
      </Routes>
    
  );
}

export default App;
