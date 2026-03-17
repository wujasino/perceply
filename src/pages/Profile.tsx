import { motion } from 'framer-motion';
import { Coffee, Clock, TrendingUp } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { pastBrews } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        {/* User info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display text-foreground">Alex Brewer</h1>
              <p className="text-sm text-muted-foreground">alex@bitbrew.io · Growth Roast Plan</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[hsl(var(--glass-border))]">
            <div className="text-center">
              <div className="text-2xl font-display text-foreground">{pastBrews.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Brews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-primary">84</div>
              <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-foreground">46</div>
              <div className="text-xs text-muted-foreground mt-1">Credits Left</div>
            </div>
          </div>
        </motion.div>

        {/* Past Brews */}
        <h2 className="text-lg font-display text-foreground mb-4">Past Brews</h2>
        <div className="space-y-3">
          {pastBrews.map((brew, i) => (
            <motion.div
              key={brew.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/dashboard?brand=${encodeURIComponent(brew.brandName)}`)}
              className="glass-card-hover p-5 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{brew.brandName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(brew.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-display text-primary">{brew.trustScore}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
