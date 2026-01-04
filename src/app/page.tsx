'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // 👈 1. استيراد Supabase
import { useRouter } from 'next/navigation'; // 👈 2. استيراد الراوتر للتوجيه
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 

export default function LoginPage() {
  const router = useRouter(); // 👈 تعريف الراوتر
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // 👈 3. الاتصال الحقيقي بـ Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError; // إذا في خطأ، انتقل للـ catch
      }

      // 👈 4. التوجيه للداشبورد عند النجاح
      router.push('/dashboard');
      router.refresh(); // لتحديث البيانات في السيرفر
      
    } catch (err: any) {
      // عرض رسالة الخطأ الحقيقية أو رسالة عامة
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-linear-to-br from-blue-50 to-blue-100">
      {/* Left Side - Headline Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 to-blue-800 text-white items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Manage your Clinic Efficiently
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Streamline your practice with our comprehensive clinic management solution. 
            Focus on what matters most - your patients.
          </p>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Headline */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-3">
              Manage your Clinic Efficiently
            </h1>
            <p className="text-blue-700">
              Sign in to access your clinic dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your clinic account</p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
                  placeholder="doctor@clinic.com"
                />
              </div>

              {/* Password Input with Toggle */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button with Loading State */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have a clinic account?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Register Here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}