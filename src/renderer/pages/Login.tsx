// pages/Login.tsx
import {   useState } from "react";
import { User } from "../../types";
import { useNavigate } from "react-router-dom";
 
import { PiSpinnerGap } from "react-icons/pi";
 

export default function Login({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false)

    const [error, setError] = useState<string | null>(null);


  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const result = await window.agent.login(email, password);

    setIsLoading(false);
      if (!(result.success)) {
        setError(result.message || "Login failed");
        return;
      }
      onLoginSuccess(result.user);
      navigate("/");
  };

  return (
    <div className="relative w-full   flex items-center justify-center mt-4 font-outfit  ">
      

      <div className="w-full max-w-md p-8 flex flex-col justify-center items-center  bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* <img
        src="/assets/logo.png"
        alt="App Logo"
        className="  w-28   object-contain mb-6 "
      /> */}
          <h2 className="text-xl font-bold  text-center bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6">
          AffoStaff | Monitoring App
        </h2>

        <hr className="w-full border-gray-200 mb-6" />

        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent ">
          Welcome Back
        </h2>
        <p className="text-gray-500 text-center mb-4">Sign in to continue</p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200     focus:border-orange-500 outline-none transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200   focus:border-orange-500 outline-none transition"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="mt-6 w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white  flex justify-center items-center font-medium rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
        >
          {isLoading ? <PiSpinnerGap className="text-white animate-spin h-6 w-6" />   : "Login"   }   
        </button>

                  {error && <p style={{ color: "red", marginTop: 4 }}>{error}</p>}


          
        {/* <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => window.open('https://crm.affotax.com', "_blank")}>Sign up</span>
        </p> */}
      </div>
    </div>
  );

}
