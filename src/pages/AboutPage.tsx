import { useEffect } from 'react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { setPageTitle } from '../utils/setPageTitle';
import { Target, Users, Zap, Shield } from 'lucide-react';

export default function AboutPage() {
  useEffect(() => { setPageTitle('আমাদের সম্পর্কে'); }, []);

  return (
    <div className="min-h-screen bg-background-main font-sans flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-dark to-primary pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="bangla text-4xl md:text-5xl font-extrabold text-white mb-4">
            আমাদের সম্পর্কে
          </h1>
          <p className="bangla text-xl text-indigo-100">
            NexusEdu — বাংলাদেশের সেরা HSC প্ল্যাটফর্ম
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="bg-white py-20 px-4 border-b border-border-light">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="bangla text-3xl font-bold text-text-primary mb-6">আমাদের লক্ষ্য</h2>
          <p className="bangla text-lg text-text-secondary leading-relaxed max-w-3xl mx-auto">
            আমাদের লক্ষ্য হলো বাংলাদেশের প্রতিটি শিক্ষার্থীর কাছে 
            সর্বোচ্চ মানের HSC পদার্থবিজ্ঞান, রসায়ন ও উচ্চতর গণিত শিক্ষা পৌঁছে দেওয়া।
            Telegram-ভিত্তিক আমাদের ক্লাউড স্টোরেজ থেকে HD মানের ভিডিও স্ট্রিম করা হয়
            যা দেশের যেকোনো প্রান্ত থেকে দেখা সম্ভব।
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-background-main py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="bangla text-3xl font-bold text-center text-text-primary mb-12">আমাদের মূলনীতি</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-card border border-border-light text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-7 h-7 text-accent" />
              </div>
              <h3 className="bangla text-xl font-bold text-text-primary mb-3">উদ্ভাবন</h3>
              <p className="bangla text-text-secondary">
                সর্বাধুনিক প্রযুক্তি ব্যবহার করে শিক্ষার মান উন্নয়ন এবং শেখার প্রক্রিয়াকে সহজতর করা।
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-card border border-border-light text-center">
              <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-7 h-7 text-success" />
              </div>
              <h3 className="bangla text-xl font-bold text-text-primary mb-3">গুণগত মান</h3>
              <p className="bangla text-text-secondary">
                সেরা শিক্ষকদের মাধ্যমে নির্ভুল এবং মানসম্মত কন্টেন্ট নিশ্চিত করা।
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-card border border-border-light text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="bangla text-xl font-bold text-text-primary mb-3">সবার জন্য শিক্ষা</h3>
              <p className="bangla text-text-secondary">
                সাশ্রয়ী মূল্যে দেশের প্রতিটি প্রান্তে মানসম্মত শিক্ষা পৌঁছে দেওয়া।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="bg-white py-20 px-4 border-t border-border-light">
        <div className="max-w-5xl mx-auto">
          <h2 className="bangla font-extrabold text-3xl text-center text-text-primary mb-12">আমাদের দল</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Card 1 */}
            <div className="group [perspective:1000px] cursor-pointer">
              <div className="relative w-full h-64 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] transition-all duration-500">
                {/* Front face */}
                <div className="absolute inset-0 bg-primary text-white flex flex-col items-center justify-center rounded-2xl shadow-card [backface-visibility:hidden]">
                  <div className="text-5xl mb-4">🧑‍💻</div>
                  <h3 className="text-xl font-bold">Md. Hasib</h3>
                  <p className="text-sm text-indigo-200 mt-1">Founder & Developer</p>
                </div>
                {/* Back face */}
                <div className="absolute inset-0 bg-white border border-border-light rounded-2xl p-6 flex flex-col items-center justify-center shadow-card [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <h3 className="text-xl font-bold text-text-primary">Md. Hasib</h3>
                  <p className="text-sm text-primary font-medium mb-4">Founder & Developer</p>
                  <p className="bangla text-text-secondary text-center">NexusEdu এর প্রতিষ্ঠাতা</p>
                  <p className="bangla text-text-muted text-sm mt-2">B.Sc CSE শিক্ষার্থী</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group [perspective:1000px] cursor-pointer">
              <div className="relative w-full h-64 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] transition-all duration-500">
                {/* Front face */}
                <div className="absolute inset-0 bg-indigo-600 text-white flex flex-col items-center justify-center rounded-2xl shadow-card [backface-visibility:hidden]">
                  <div className="text-5xl mb-4">👨‍🏫</div>
                  <h3 className="text-xl font-bold">Rahim Uddin</h3>
                  <p className="text-sm text-indigo-200 mt-1">Lead Instructor</p>
                </div>
                {/* Back face */}
                <div className="absolute inset-0 bg-white border border-border-light rounded-2xl p-6 flex flex-col items-center justify-center shadow-card [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <h3 className="text-xl font-bold text-text-primary">Rahim Uddin</h3>
                  <p className="text-sm text-indigo-600 font-medium mb-4">Lead Instructor</p>
                  <p className="bangla text-text-secondary text-center">প্রধান শিক্ষক</p>
                  <p className="bangla text-text-muted text-sm mt-2">M.Sc Physics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="bg-primary-dark py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">১৮</div>
              <div className="bangla text-sm font-medium text-indigo-100">সাইকেল</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">৩০০+</div>
              <div className="bangla text-sm font-medium text-indigo-100">ভিডিও ক্লাস</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">৩</div>
              <div className="bangla text-sm font-medium text-indigo-100">মূল বিষয়</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">১০k+</div>
              <div className="bangla text-sm font-medium text-indigo-100">শিক্ষার্থী</div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex-grow"></div>
      <PublicFooter />
    </div>
  );
};
