import { Link } from 'react-router-dom'
import { IconFacebook, IconTwitter, IconInstagram, IconYoutube, IconLinkedin } from '../icons/CustomIcons'
import './Footer.scss'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-gold-border" />
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <img
              src="https://www.asurams.edu/_resources/img/asurams_official_logo.png"
              alt="Albany State University"
              className="footer-logo"
              width="200"
              loading="lazy"
            />
            <p className="footer-tagline">Where Dreams Find Direction</p>
            <p className="footer-desc">
              A nationally top-ranked HBCU and proud member of the University System of Georgia. Founded in 1903 by Joseph Winthrop Holley.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/AlbanyStateUniversity" target="_blank" rel="noopener noreferrer" aria-label="Facebook" data-cursor-text="Follow"><IconFacebook size={20} color="rgba(255,255,255,0.7)" /></a>
              <a href="https://twitter.com/AlbanyStateUniv" target="_blank" rel="noopener noreferrer" aria-label="Twitter" data-cursor-text="Follow"><IconTwitter size={20} color="rgba(255,255,255,0.7)" /></a>
              <a href="https://www.instagram.com/albanystateuniv" target="_blank" rel="noopener noreferrer" aria-label="Instagram" data-cursor-text="Follow"><IconInstagram size={20} color="rgba(255,255,255,0.7)" /></a>
              <a href="https://www.youtube.com/user/AlbanyStateUniv" target="_blank" rel="noopener noreferrer" aria-label="YouTube" data-cursor-text="Follow"><IconYoutube size={20} color="rgba(255,255,255,0.7)" /></a>
              <a href="https://www.linkedin.com/school/albany-state-university" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-cursor-text="Follow"><IconLinkedin size={20} color="rgba(255,255,255,0.7)" /></a>
            </div>
          </div>

          {/* Explore */}
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/about">About ASU</Link></li>
              <li><Link to="/academics">Academics</Link></li>
              <li><Link to="/student-life">Student Life</Link></li>
              <li><Link to="/apply">Admissions</Link></li>
              <li><a href="https://www.asurams.edu/athletics" target="_blank" rel="noopener noreferrer">Athletics</a></li>
              <li><a href="https://www.asurams.edu/research" target="_blank" rel="noopener noreferrer">Research</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="https://www.asurams.edu/financial-aid" target="_blank" rel="noopener noreferrer">Financial Aid</a></li>
              <li><a href="https://www.asurams.edu/library" target="_blank" rel="noopener noreferrer">Library</a></li>
              <li><a href="https://www.asurams.edu/bookstore" target="_blank" rel="noopener noreferrer">Bookstore</a></li>
              <li><a href="https://www.asurams.edu/career-services" target="_blank" rel="noopener noreferrer">Career Services</a></li>
              <li><a href="https://www.asurams.edu/campus-safety" target="_blank" rel="noopener noreferrer">Campus Safety</a></li>
              <li><a href="https://www.asurams.edu/registrar" target="_blank" rel="noopener noreferrer">Registrar</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="footer-col">
            <h4>Connect</h4>
            <div className="footer-campus">
              <p className="campus-label">East Campus</p>
              <p>504 College Drive<br />Albany, GA 31705</p>
            </div>
            <div className="footer-campus">
              <p className="campus-label">West Campus</p>
              <p>2400 Gillionville Road<br />Albany, GA 31707</p>
            </div>
            <div className="footer-phone">
              <p className="campus-label">Main Line</p>
              <a href="tel:2295002000">(229) 500-2000</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Albany State University. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="https://www.asurams.edu/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="https://www.asurams.edu/accessibility" target="_blank" rel="noopener noreferrer">Accessibility</a>
            <a href="https://www.asurams.edu/title-ix" target="_blank" rel="noopener noreferrer">Title IX</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
