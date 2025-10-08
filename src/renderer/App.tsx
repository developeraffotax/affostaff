import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useEffect, useState } from "react";
import { User } from "../types";
import { useTimer } from "./hooks/useTimer";
function App() {

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const timer = useTimer()

  useEffect(() => {
    window.agent.getState().then((state) => {
      console.log("THE STATE", state)
      setUser(state.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    
<div className="w-full  flex flex-col justify-between items-center">
        <Routes>
 
        <Route
          path="/login"
          element={<Login onLoginSuccess={(user) => setUser(user)} />}
        />


        <Route
          path="/"
          element={
            user && user.jwt ? (
              <Dashboard timer={timer} user={user} onLogoutSuccess={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
      </Routes>

      {user && <p className="fixed bottom-0 text-center mb-1 text-sm text-gray-600">Logged in as: {user.name}</p>}
</div>
    
  );
}

export default App;
