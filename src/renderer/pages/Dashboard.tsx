import { useNavigate } from "react-router-dom";
import { User } from "../../types";

// pages/Dashboard.tsx
export default function Dashboard({ user, onLogoutSuccess }: {user: User, onLogoutSuccess: () => void}) {
const navigate = useNavigate()
    const handleLogout = async () => {
    try {
       await window.agent.logout()
      onLogoutSuccess();  
      //  navigate('/login') 
    } catch (err: any) {
      console.log("Error occured while loggin out", err?.message)
      //alert("Login failed");



    }
  };


  return (
    <div className="p-4">
      <h1>Welcome, {user.email}</h1>
      <h1>Welcome, {user.name}</h1>
      <button onClick={handleLogout }>Logout</button>
    </div>
  );
}