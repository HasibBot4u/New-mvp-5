import React from 'react';
import { Link } from 'react-router-dom';
import { NexusLogo } from '../shared/NexusLogo';
import { Facebook, Youtube, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-border-light pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div className="md:col-span-1">
            <div className="inline-block mb-6">
              <NexusLogo withSubtitle={false} />
            </div>
            <p className="bangla text-text-secondary mb-6 leading-relaxed">
              বাংলাদেশের সেরা HSC ভিডিও ক্লাস প্ল্যাটফর্ম। তোমার শিক্ষার নতুন দিগন্ত উন্মোচনে আমরা আছি তোমার পাশে।
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-background-section flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background-section flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background-section flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="bangla font-bold text-lg text-text-primary mb-6">দ্রুত লিংক</h3>
            <ul className="space-y-4">
              <li><a href="/#courses" className="bangla text-text-secondary hover:text-primary transition-colors">কোর্সসমূহ</a></li>
              <li><Link to="/success-stories" className="bangla text-text-secondary hover:text-primary transition-colors">সাফল্য গাথা</Link></li>
              <li><Link to="/about" className="bangla text-text-secondary hover:text-primary transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/contact" className="bangla text-text-secondary hover:text-primary transition-colors">যোগাযোগ</Link></li>
            </ul>
          </div>

          {/* Column 3: Subjects */}
          <div>
            <h3 className="bangla font-bold text-lg text-text-primary mb-6">বিষয়সমূহ</h3>
            <ul className="space-y-4">
              <li><Link to="/signup" className="bangla text-text-secondary hover:text-primary transition-colors">পদার্থবিজ্ঞান</Link></li>
              <li><Link to="/signup" className="bangla text-text-secondary hover:text-primary transition-colors">রসায়ন</Link></li>
              <li><Link to="/signup" className="bangla text-text-secondary hover:text-primary transition-colors">উচ্চতর গণিত</Link></li>
              <li><Link to="/signup" className="bangla text-text-secondary hover:text-primary transition-colors">মডেল টেস্ট</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="bangla font-bold text-lg text-text-primary mb-6">যোগাযোগ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-text-secondary">support@nexusedu.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-text-secondary">+880 1X-XXXXXXXX</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="bangla text-text-secondary">ঢাকা, বাংলাদেশ</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} NexusEdu. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="text-text-muted hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-text-muted hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/refund-policy" className="text-text-muted hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
