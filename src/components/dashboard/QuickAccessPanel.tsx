
import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Brain, Bell, User, TrendingUp } from 'lucide-react';

export const QuickAccessPanel: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Forecasts',
      description: 'View detailed predictions',
      icon: TrendingUp,
      route: '/forecasts',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Insights',
      description: 'Analyze air quality trends',
      icon: BarChart3,
      route: '/insights',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Health Tips',
      description: 'Get personalized advice',
      icon: Brain,
      route: '/forecasts',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'Profile',
      description: 'Manage your settings',
      icon: User,
      route: '/profile',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      title: 'Alerts',
      description: 'Set up notifications',
      icon: Bell,
      route: '/alerts',
      color: 'bg-red-50 hover:bg-red-100 border-red-200'
    }
  ];

  return (
    <DashboardCard
      title="Quick Access"
      description="Navigate to different sections of the app"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-center gap-2 ${action.color}`}
              onClick={() => navigate(action.route)}
            >
              <Icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
    </DashboardCard>
  );
};
