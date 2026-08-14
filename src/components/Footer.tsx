import { Link } from 'react-router-dom';

const Footer = () => {
  const scrollToTopAfterNavigation = () => {
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
                <Link to="/about" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Connect
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/cookie-policy" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/sitemap" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/advertise" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Advertise
                </Link>
              </li>
              <li>
                <Link to="/blogs" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Lighthouse
                </Link>
              </li>
              <li>
                <Link to="/resources" onClick={scrollToTopAfterNavigation} className="text-muted-foreground hover:text-primary transition-colors">
                  Resources
                </Link>
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
