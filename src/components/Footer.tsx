import { Link, useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };
  
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-16">
      <div className="mx-auto px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/about')} className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/contact')} className="text-muted-foreground hover:text-primary transition-colors">
                  Connect
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/privacy-policy')} className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/terms')} className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/disclaimer')} className="text-muted-foreground hover:text-primary transition-colors">
                  Disclaimer
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/cookie-policy')} className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/sitemap')} className="text-muted-foreground hover:text-primary transition-colors">
                  Sitemap
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/')} className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/advertise')} className="text-muted-foreground hover:text-primary transition-colors">
                  Advertise
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/blogs')} className="text-muted-foreground hover:text-primary transition-colors">
                  Lighthouse
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/resources')} className="text-muted-foreground hover:text-primary transition-colors">
                  Resources
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Opp Avenue. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
