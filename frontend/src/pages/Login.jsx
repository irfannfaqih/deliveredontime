import { clsx } from "clsx";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import React, { useState } from "react";
 
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import backgroundLogin from "../assets/background_login.svg";
import logo from "../assets/logo.svg";
import { useAuth } from "../hooks/useAPI";

// Utility function
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Button Component
const Button = React.forwardRef(({ className, type = "button", ...props }, ref) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Card Components
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Input Component
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Label Component
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

// Loading Spinner Component
const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Main Login Component
export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  // State untuk form
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [shakeEffect, setShakeEffect] = useState(false);

  // Handle perubahan input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error saat user mulai mengetik
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear login error saat user mengetik
    if (loginError) {
      setLoginError('');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleLogin();
    }
  };

  // Validasi form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username wajib diisi';
    }
    
    if (!formData.password) {
      errors.password = 'Password wajib diisi';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Menangani proses login ketika tombol ditekan (bukan submit form)
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    // Reset error sebelum login
    setLoginError('');
    
    try {
      // Konversi username ke email jika bukan email
      const emailOrUsername = formData.username.includes('@') 
        ? formData.username 
        : `${formData.username}@delivered.com`;
      const result = await login(emailOrUsername, formData.password);
      if (result?.success) {
        setShowSuccess(true);
        setLoginError('');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        // Autentikasi gagal: tampilkan pesan kesalahan dan animasi feedback
        setLoginError('Username atau password yang Anda masukkan salah');
        setShakeEffect(true);
        setTimeout(() => setShakeEffect(false), 600);
      }
    } catch {
      setLoginError('Terjadi kesalahan. Silakan coba lagi.');
      setShakeEffect(true);
      
      setTimeout(() => setShakeEffect(false), 600);
    }
  };

  React.useEffect(() => {
    // Kunci scroll hanya di halaman login
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  

  return (
    <main className="login-page relative flex items-center sm:items-center justify-center sm:justify-center min-h-screen w-screen bg-white overflow-hidden pt-10 sm:pt-14 lg:pt-20 pb-6">
      
      
      {/* Background */}
      <img
        className="absolute top-0 left-0 w-full h-full object-cover sm:max-h-[54%] max-h-[35%]"
        alt="Background Login"
        src={backgroundLogin}
      />

      {/* Logo */}
      <img
        className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-9 sm:top-6 sm:w-28 sm:h-12 lg:left-8 lg:translate-x-0 z-10 opacity-100"
        alt="Delivered Ontime Logo"
        src={logo}
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      {/* Card */}
      <div className="flex flex-col items-center gap-4 z-10 w-full max-w-lg sm:max-w-xl md:max-w-2xl px-4">
        <Card className={cn(
          "w-full bg-white rounded-2xl shadow-[11px_9px_31px_#0000000d,43px_36px_56px_#0000000a,97px_81px_76px_#00000008,172px_144px_90px_#00000003,268px_225px_98px_transparent]",
          shakeEffect && "animate-shake"
        )}>
          <CardContent className="flex flex-col items-center py-8 sm:py-12 px-4 sm:px-8 md:px-12">
            <header className="text-center mb-8">
              <h1 className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-bold text-black text-2xl sm:text-3xl leading-tight mb-2">
                Log In to <br />
                Delivered on Time
              </h1>
              <p className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#616161] text-xs tracking-[0.70px]">
                Fast • Reliable • Ontime
              </p>
            </header>

            {/* Notifikasi berhasil login: tampil singkat lalu redirect ke dashboard */}
            {showSuccess && (
              <div className="w-full sm:max-w-[380px] mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                <p className="text-sm text-green-700 text-center font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Login berhasil! Mengalihkan...
                </p>
              </div>
            )}

            {/* Notifikasi kesalahan autentikasi: muncul saat username/password tidak valid */}
            {loginError && !showSuccess && (
              <div className="w-full sm:max-w-[380px] mb-4 p-3 bg-red-50 border border-red-300 rounded-lg animate-fade-in">
                <p className="text-sm text-red-700 text-center font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {loginError}
                </p>
              </div>
            )}

              <div className="w-full max-w-full sm:max-w-[380px] flex flex-col gap-3 sm:gap-4 bg-white/85 backdrop-blur-sm rounded-xl p-4 sm:bg-transparent sm:backdrop-blur-0 sm:p-0">
              {/* Username */}
              <div className="relative">
                <Label
                  htmlFor="username"
                  className={cn(
                    "block mb-1 lg:absolute lg:top-0 lg:left-[11px] lg:bg-white lg:px-[5.5px] [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[12.8px] leading-[22.5px] lg:z-10 pointer-events-none",
                    (validationErrors.username || loginError) ? "text-red-500" : "text-[#424242]"
                  )}
                >
                  Username / Email
                </Label>
                
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="email@domain.com"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={cn(
                    "w-full h-12 sm:h-[58px] rounded-lg border py-3 lg:pt-[25px] lg:pb-[10px] pl-4 pr-4 [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-base",
                    (validationErrors.username || loginError)
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500" 
                      : "border-[#424242] text-[#424242]"
                  )}
                  disabled={isLoading}
                />
                {validationErrors.username && (
                  <p className="mt-1 text-xs text-red-600 [font-family:'Zen_Kaku_Gothic_Antique',Helvetica]">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <Label
                  htmlFor="password"
                  className={cn(
                    "block mb-1 lg:absolute lg:top-0 lg:left-[11px] lg:bg-white lg:px-[5.5px] [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[12.8px] leading-[22.5px] lg:z-10 pointer-events-none",
                    (validationErrors.password || loginError) ? "text-red-500" : "text-[#bebebe]"
                  )}
                >
                  Password
                </Label>
                
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={cn(
                      "w-full h-12 sm:h-[58px] rounded-lg border py-3 lg:pt-[25px] lg:pb-[10px] pl-4 pr-12 [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-base",
                      (validationErrors.password || loginError)
                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500" 
                        : "border-[#bdbdbd] text-[#757575]"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 disabled:opacity-50"
                    aria-label="Toggle password visibility"
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-4 h-4 text-[#757575]" />
                    ) : (
                      <EyeIcon className="w-4 h-4 text-[#757575]" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-600 [font-family:'Zen_Kaku_Gothic_Antique',Helvetica]">
                    {validationErrors.password}
                  </p>
                )}
              </div>
              <div className="lg:hidden flex items-center justify-between mt-2 py-2">
                <label className="flex items-center gap-2 text-sm text-[#616161]">
                  <input type="checkbox" className="accent-[#212121]" />
                  Ingat saya
                </label>
                <a href="#" className="text-sm text-[#424242] underline">Lupa password?</a>
              </div>

              <Button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className={cn(
                  "block lg:hidden w-full h-14 rounded-xl [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-bold text-white text-base transition-colors",
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : showSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#212121] hover:bg-[#424242]"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    SIGNING IN...
                  </div>
                ) : showSuccess ? (
                  "SUCCESS!"
                ) : (
                  "CONTINUE"
                )}
              </Button>

              <Button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className={cn(
                  "hidden lg:block w-full h-12 lg:h-14 rounded-lg [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-bold text-white text-sm lg:text-[12.8px] transition-colors",
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : showSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#212121] hover:bg-[#424242]"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    SIGNING IN...
                  </div>
                ) : showSuccess ? (
                  "SUCCESS!"
                ) : (
                  "CONTINUE"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
  </div>

      <footer className="absolute bottom-[30px] text-center [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-light text-[#616161] text-[10.3px] tracking-[0.70px] z-10 hidden sm:block">
        © 2025 Delivered Ontime. Fast • Reliable • Ontime
      </footer>

      {/* Animasi halaman: keyframes shake untuk feedback error, fade-in untuk transisi */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          animation-delay: var(--animation-delay, 0ms);
        }
      `}</style>
    </main>
  );
};

export default Login;
