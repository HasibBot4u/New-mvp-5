import React, { useState } from 'react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Mail, Phone, MapPin, MessageSquare, CheckCircle2, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background-main font-sans flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-dark to-primary pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="bangla text-4xl md:text-5xl font-extrabold text-white mb-4">
            যোগাযোগ করুন
          </h1>
          <p className="bangla text-xl text-indigo-100">
            যেকোনো প্রশ্ন বা মতামতের জন্য আমাদের সাথে যোগাযোগ করুন
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 flex-grow">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left Column - Contact Info */}
          <div>
            <h2 className="bangla text-3xl font-bold text-text-primary mb-8">আমাদের সাথে যুক্ত হোন</h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-card border border-border-light flex items-start gap-4 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="bangla font-bold text-text-primary text-lg mb-1">ইমেইল</p>
                  <p className="text-text-secondary">support@nexusedu.com</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-card border border-border-light flex items-start gap-4 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="bangla font-bold text-text-primary text-lg mb-1">ফোন</p>
                  <p className="text-text-secondary">+880 1X-XXXXXXXX</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-card border border-border-light flex items-start gap-4 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="bangla font-bold text-text-primary text-lg mb-1">ঠিকানা</p>
                  <p className="bangla text-text-secondary">ঢাকা, বাংলাদেশ</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-card border border-border-light flex items-start gap-4 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="bangla font-bold text-text-primary text-lg mb-1">Facebook</p>
                  <a href="#" className="text-primary hover:underline font-medium">NexusEdu Page</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-light">
            <h2 className="bangla text-2xl font-bold text-text-primary mb-6">আমাদের বার্তা পাঠান</h2>
            
            {isSubmitted ? (
              <div className="bg-success/10 border border-success/20 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h3 className="bangla font-bold text-xl text-text-primary mb-2">ধন্যবাদ!</h3>
                <p className="bangla text-text-secondary">আপনার বার্তা সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 bangla text-primary font-medium hover:underline"
                >
                  নতুন বার্তা পাঠান
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="bangla block text-sm font-medium text-text-secondary mb-1.5">আপনার নাম</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-background-section"
                    placeholder="আপনার নাম লিখুন"
                  />
                </div>
                
                <div>
                  <label className="bangla block text-sm font-medium text-text-secondary mb-1.5">আপনার ইমেইল</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-4 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-background-section"
                    placeholder="example@email.com"
                  />
                </div>
                
                <div>
                  <label className="bangla block text-sm font-medium text-text-secondary mb-1.5">বিষয়</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-background-section"
                    placeholder="কী বিষয়ে জানতে চান?"
                  />
                </div>
                
                <div>
                  <label className="bangla block text-sm font-medium text-text-secondary mb-1.5">বার্তা</label>
                  <textarea 
                    required 
                    rows={4}
                    className="w-full px-4 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none bg-background-section"
                    placeholder="আপনার বার্তা এখানে লিখুন..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit"
                  className="bangla w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  বার্তা পাঠান
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
