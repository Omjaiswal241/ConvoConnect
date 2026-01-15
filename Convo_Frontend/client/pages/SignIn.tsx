import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Field-level errors from Zod
        if (data?.errors?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const key of Object.keys(data.errors.fieldErrors)) {
            const messages = data.errors.fieldErrors[key];
            if (messages && messages.length > 0) {
              fieldErrors[key] = messages[0];
            }
          }
          setErrors(fieldErrors);
        }

        setApiError(data?.message || "Sign in failed");
        return;
      }

      // Save token/user info for authenticated requests
      if (data?.token) {
        localStorage.setItem("convo_token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("convo_user", JSON.stringify(data.user));
      }

      navigate("/joinroom");
    } catch (error) {
      console.error("Sign in failed:", error);
      setApiError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <MessageCircle className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Convo</span>
          </Link>
        </div>
      </nav>

      {/* Sign In Form */}
      <section className="flex items-center justify-center min-h-[calc(100vh-70px)] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl p-8 border border-border shadow-lg">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mb-8">
              Sign in to continue to Convo
            </p>

            {apiError && (
              <p className="mb-4 text-sm text-destructive">{apiError}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    errors.email ? "border-destructive" : "border-border"
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link to="/" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    errors.password ? "border-destructive" : "border-border"
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
