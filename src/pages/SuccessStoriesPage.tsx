import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { ArrowRight, GraduationCap, Award, Quote } from 'lucide-react';

export const SuccessStoriesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-main font-sans flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-dark to-primary pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <Award className="w-5 h-5 text-accent" />
            <span className="bangla text-white font-medium">গর্বিত শিক্ষার্থীরা</span>
          </div>
          <h1 className="bangla text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            শিক্ষার্থীদের <span className="text-accent">সাফল্য গাথা</span>
          </h1>
          <p className="bangla text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            আমাদের শিক্ষার্থীরা দেশের সেরা বিশ্ববিদ্যালয়গুলোতে ভর্তি হয়েছে। তাদের সফলতার গল্পগুলো জানুন।
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="bangla bg-accent hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              ফ্রি শুরু করুন <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/#courses')}
              className="bangla bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm"
            >
              কোর্স দেখুন
            </button>
          </div>
        </div>
      </section>

      {/* Achievement Cards */}
      <section className="bg-white py-20 px-4 border-b border-border-light relative z-20 -mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl shadow-card p-6 text-center border border-border-light hover:shadow-card-hover transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:rotate-12 transition-transform">
                <span className="text-3xl text-white">🥇</span>
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-2">BUET Top 3</h3>
              <p className="bangla text-sm text-text-secondary">বুয়েটে সেরা ৩ জনের মধ্যে আমাদের শিক্ষার্থী</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-card p-6 text-center border border-border-light hover:shadow-card-hover transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:rotate-12 transition-transform">
                <span className="text-3xl text-white">🏛️</span>
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-2">DU 1st</h3>
              <p className="bangla text-sm text-text-secondary">ঢাকা বিশ্ববিদ্যালয়ে প্রথম স্থান</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-card p-6 text-center border border-border-light hover:shadow-card-hover transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:rotate-12 transition-transform">
                <span className="text-3xl text-white">🎓</span>
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-2">RUET 1st</h3>
              <p className="bangla text-sm text-text-secondary">রুয়েটে প্রথম স্থান</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-card p-6 text-center border border-border-light hover:shadow-card-hover transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:rotate-12 transition-transform">
                <span className="text-3xl text-white">⭐</span>
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-2">CUET 1st</h3>
              <p className="bangla text-sm text-text-secondary">চুয়েটে প্রথম স্থান</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="bg-background-main py-20 px-4 flex-grow">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="bangla text-4xl font-extrabold text-text-primary mb-4">শিক্ষার্থীরা কী বলছে</h2>
            <p className="bangla text-lg text-text-secondary">
              NexusEdu এর সাথে প্রস্তুতি নিয়ে সফল হওয়া শিক্ষার্থীদের অভিজ্ঞতা
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "রাহুল আহমেদ", subject: "Physics", quote: "পদার্থবিজ্ঞান MCQ-তে ৯৮% পেয়েছি NexusEdu-র সাহায্যে। মডেল টেস্টগুলো একদম রিয়েল পরীক্ষার মতো ছিল।", uni: "BUET 2024" },
              { name: "ফাতেমা খানম", subject: "Chemistry", quote: "রসায়নে ভয় ছিল, এখন ভালোবাসি। সাইকেল ভিত্তিক ক্লাসগুলো কনসেপ্ট ক্লিয়ার করতে অনেক সাহায্য করেছে।", uni: "DU 2024" },
              { name: "করিম হোসেন", subject: "Math", quote: "উচ্চতর গণিতে A+ পেয়েছি। ভিডিওগুলো যেকোনো সময় দেখতে পারায় রিভিশন দেওয়া সহজ হয়েছে।", uni: "BUET 2024" },
              { name: "সুমাইয়া আক্তার", subject: "Physics+Chemistry", quote: "লাইভ ক্লাস অনেক কাজে এসেছে। Q&A সেকশনে প্রশ্ন করলে সাথে সাথে উত্তর পাওয়া যেত।", uni: "RUET 2024" },
              { name: "তানভীর হাসান", subject: "All subjects", quote: "MCQ মডেল টেস্টে ধারাবাহিকভাবে প্র্যাকটিস করেছি। নেগেটিভ মার্কিং থাকায় পরীক্ষার ভীতি কমেছে।", uni: "CUET 2024" },
              { name: "নাফিসা তাবাসসুম", subject: "Math", quote: "প্রতিটি চ্যাপ্টার পরিষ্কারভাবে বোঝানো হয়েছে। বেসিক থেকে অ্যাডভান্স সব কভার করা হয়েছে।", uni: "SUST 2024" },
            ].map((student, i) => (
              <div key={i} className="bg-white rounded-3xl shadow-card p-8 border border-border-light hover:shadow-card-hover transition-shadow relative">
                <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
                <div className="flex items-center gap-1 text-accent mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="bangla text-text-secondary italic mb-6 min-h-[80px] leading-relaxed">"{student.quote}"</p>
                
                <div className="flex items-center gap-4 pt-6 border-t border-border-light">
                  <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center text-xl font-bold shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="bangla font-bold text-text-primary">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted">{student.subject}</span>
                      <span className="w-1 h-1 rounded-full bg-border-light"></span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        <GraduationCap className="w-3 h-3" />
                        {student.uni}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20 px-4 border-t border-border-light text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary-dark to-primary rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -ml-20 -mb-20" />
          
          <div className="relative z-10">
            <h2 className="bangla text-4xl font-extrabold text-white mb-6">
              তুমিও সফল হও!
            </h2>
            <p className="bangla text-indigo-100 mb-10 text-xl max-w-2xl mx-auto">
              আজই NexusEdu তে যুক্ত হয়ে তোমার প্রস্তুতি শুরু করো।
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="bangla bg-accent hover:bg-amber-600 text-white font-bold px-10 py-4 rounded-xl text-xl transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2"
            >
              রেজিস্ট্রেশন করুন <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
