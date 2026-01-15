import { Link } from "react-router-dom";
import { MessageCircle, Users, Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Convo</span>
          </div>
          <div className="flex gap-4">
            <Link
              to="/signin"
              className="px-6 py-2 text-foreground hover:text-primary transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Connect with <span className="text-primary">conversations</span>{" "}
              that matter
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Convo is the modern way to chat. Create rooms, invite friends, and
              have meaningful conversations in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-center"
              >
                Get Started
              </Link>
              <Link
                to="/joinroom"
                className="px-8 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-semibold text-center"
              >
                Join a Room
              </Link>
            </div>
          </div>

          {/* Feature illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-12 aspect-square flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-32 h-32 text-primary/40 mx-auto mb-6" />
                <p className="text-muted-foreground text-lg">
                  Real-time conversations at your fingertips
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-foreground text-center mb-16">
            Why choose Convo?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Instant Messaging
              </h3>
              <p className="text-muted-foreground">
                Send and receive messages instantly with beautiful, intuitive
                interface.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Group Rooms
              </h3>
              <p className="text-muted-foreground">
                Create rooms and invite multiple people for seamless group
                conversations.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Lightning Fast
              </h3>
              <p className="text-muted-foreground">
                Experience smooth, real-time interactions with minimal latency
                and maximum reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-primary to-accent/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to start conversing?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            Join Convo today and connect with people who matter to you.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3 bg-primary-foreground text-primary rounded-lg hover:bg-primary-foreground/90 transition-colors font-semibold"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2026 Convo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
