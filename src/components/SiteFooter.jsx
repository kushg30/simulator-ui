import { Link } from "react-router-dom";

/**
 * The marketing-site footer.
 *
 * Extracted from the homepage so the simulation pages carry the identical footer rather than a
 * copy that drifts. Section links are absolute (`/#how`) rather than bare fragments (`#how`),
 * because a bare fragment on /simulations/phoenix-ai-judgment would look for that section on the
 * simulation page and do nothing.
 */
export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="logo footer-logo">
            <span className="logo-biz">CASE</span>
            <span className="logo-sim">RUN</span>
          </div>
          <p>
            The decisions your students make in the next two hours will follow them for the rest of
            their careers
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <div className="footer-heading">Product</div>
            <Link to="/#simulators">Simulations</Link>
            <Link to="/#how">How It Works</Link>
            <Link to="/#about">About</Link>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Contact</div>
            <a href="mailto:hello@caserun.in">hello@caserun.in</a>
            <a href="mailto:hello@caserun.in?subject=Book%20a%20demo">Book a Demo</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© 2026 CaseRun. All rights reserved.</span>
          <span>Privacy Policy · Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
