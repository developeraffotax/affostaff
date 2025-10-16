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

  const [key, setKey] = useState(""); 

  useEffect(() => {
    window.agent.getState().then((state) => {
      setUser(state.user);
      setLoading(false);
    });

    // window.agent.onKeyStroke((data) => {
    //     setKey(JSON.stringify(data));
    //   console.log("KeyStroke", data);
    // })


  }, []);

  useEffect(() => {
  window.agent.onLogout( () => setUser(null) );
}, []);

 

if (loading)
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    
<div className="w-full  flex flex-col justify-between items-center">
  {/* key: {key} */}
        <Routes>
 
        <Route
          path="/login"
          element={<Login onLoginSuccess={(user) => setUser(user)} />}
        />


        <Route
          path="/"
          element={
            user && user.jwt ? (
              <Dashboard timer={timer} user={user}  />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
      </Routes>

      {user?.name && <p className="fixed bottom-0 text-center mb-1 text-sm text-gray-600">Logged in as: {user.name}</p>}
</div>
    
  );
}

export default App;
