import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Bot, ShieldCheck, LineChart, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/Button';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      title: 'Conversational Co-pilot',
      desc: 'Execute real-time ERP inquiries, match line items, and audit approvals using natural language linked directly to S/4HANA records.',
      icon: Bot,
      color: 'text-sap-accent bg-sap-accent/10'
    },
    {
      title: 'Workflow Visualizer',
      desc: 'Track and process purchase orders across manager, finance, and vendor verification cycles with pixel-perfect timeline states.',
      icon: ShieldCheck,
      color: 'text-sap-blue bg-sap-blue/10'
    },
    {
      title: 'Predictive Supplier Analytics',
      desc: 'Evaluate delivery speeds, check quality scores, and isolate supply chain risks before releasing purchase allocations.',
      icon: LineChart,
      color: 'text-sap-status-success-text bg-sap-status-success-bg'
    },
    {
      title: 'Automated Invoice Audits',
      desc: 'Drag and drop invoices to automatically extract data, run 3-way matching audits, and flag duplicate ledger hazards.',
      icon: FileSpreadsheet,
      color: 'text-sap-status-warning-text bg-sap-status-warning-bg'
    }
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero section */}
      <section className="relative py-20 bg-white dark:bg-sap-bg-dark border-b border-sap-border-light dark:border-sap-border-dark overflow-hidden transition-colors">
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-sap-blue/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-sap-accent/5 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
            <Bot className="w-4 h-4" />
            <span>Next-Generation SAP Procurement</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-sap-gray-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Autonomous ERP Intelligence for <span className="text-sap-blue dark:text-sap-blue-medium">Procurement Operations</span>
          </h2>
          
          <p className="mt-6 text-base sm:text-lg text-sap-gray-500 dark:text-sap-gray-400 max-w-2xl mx-auto leading-relaxed">
            Unleash conversational AI over S/4HANA workflows. Automate invoice verification, compare supplier scorecards, and expedite manager approvals within one unified corporate cockpit.
          </p>

          <div className="mt-10 flex justify-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              Access ERP Dashboard
            </Button>
            <a href="#features">
              <Button variant="secondary" size="lg">
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature section */}
      <section id="features" className="py-20 bg-sap-bg-light dark:bg-sap-bg-dark/40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-3xl font-extrabold text-sap-gray-900 dark:text-white">Built for High-Velocity Procurement</h3>
            <p className="mt-4 text-sm text-sap-gray-500 dark:text-sap-gray-400">
              Integrate Generative AI directly within core logistics, finance, and supplier management processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="fiori-card p-6 flex flex-col items-start bg-white dark:bg-sap-card-dark transition-transform hover:-translate-y-1">
                  <div className={`p-3 rounded-lg ${feat.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-sap-gray-800 dark:text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-sap-gray-500 dark:text-sap-gray-400 leading-relaxed flex-grow">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
