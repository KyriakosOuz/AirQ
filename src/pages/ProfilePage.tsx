
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { supabase } from "@/integrations/supabase/client";

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useUserStore();
  const [profile, setProfile] = useState({
    age: user?.age || 35,
    hasAsthma: user?.hasAsthma || false,
    isSmoker: user?.isSmoker || false,
    hasHeartIssues: user?.hasHeartIssues || false,
    hasDiabetes: user?.hasDiabetes || false,
    hasLungDisease: user?.hasLungDisease || false,
  });
  const [riskData, setRiskData] = useState<any[]>([]);
  const [showingRiskTimeline, setShowingRiskTimeline] = useState(false);
  
  // Mock data for risk timeline - in a real app, this would come from an endpoint
  useEffect(() => {
    const mockRiskData = [
      { month: "Jan 2024", risk: 25 },
      { month: "Feb 2024", risk: 28 },
      { month: "Mar 2024", risk: 32 },
      { month: "Apr 2024", risk: 35 },
      { month: "May 2024", risk: 30 },
      { month: "Jun 2024", risk: 25 },
      { month: "Jul 2024", risk: 20 },
      { month: "Aug 2024", risk: 18 },
      { month: "Sep 2024", risk: 22 },
      { month: "Oct 2024", risk: 27 },
      { month: "Nov 2024", risk: 32 },
      { month: "Dec 2024", risk: 35 },
      { month: "Jan 2025", risk: 37 },
      { month: "Feb 2025", risk: 35 },
      { month: "Mar 2025", risk: 32 },
      { month: "Apr 2025", risk: 28 },
      { month: "May 2025", risk: 25 },
      { month: "Jun 2025", risk: 23 },
      { month: "Jul 2025", risk: 20 },
      { month: "Aug 2025", risk: 22 },
      { month: "Sep 2025", risk: 27 },
      { month: "Oct 2025", risk: 30 },
      { month: "Nov 2025", risk: 33 },
      { month: "Dec 2025", risk: 35 },
      { month: "Jan 2026", risk: 38 },
      { month: "Feb 2026", risk: 36 },
      { month: "Mar 2026", risk: 33 },
      { month: "Apr 2026", risk: 30 },
      { month: "May 2026", risk: 27 },
      { month: "Jun 2026", risk: 25 },
    ];
    
    setRiskData(mockRiskData);
  }, []);

  // Fetch profile from Supabase on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile");
          return;
        }
        
        if (data) {
          setProfile({
            age: data.age || 35,
            hasAsthma: data.has_asthma || false,
            isSmoker: data.is_smoker || false,
            hasHeartIssues: data.has_heart_disease || false,
            hasDiabetes: false, // Not in current profiles table
            hasLungDisease: false, // Not in current profiles table
          });
          
          toast.success("Profile loaded");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  const saveProfile = async () => {
    setLoading(true);
    try {
      const success = await updateProfile({
        age: profile.age,
        hasAsthma: profile.hasAsthma,
        isSmoker: profile.isSmoker,
        hasHeartIssues: profile.hasHeartIssues,
        hasDiabetes: profile.hasDiabetes,
        hasLungDisease: profile.hasLungDisease
      });
      
      if (success) {
        toast.success("Profile saved successfully");
      } else {
        toast.error("Failed to save profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRiskTimeline = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch this from Supabase or an API endpoint
      // const { data, error } = await supabase.functions.invoke('get-risk-timeline', {
      //   body: { user_id: user?.id }
      // });
      
      // For demo, we'll just show the mock data
      setShowingRiskTimeline(true);
      toast.success("Risk timeline loaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load risk timeline");
    } finally {
      setLoading(false);
    }
  };
  
  const resetProfile = () => {
    if (!user) return;
    
    setProfile({
      age: user.age || 35,
      hasAsthma: user.hasAsthma || false,
      isSmoker: user.isSmoker || false,
      hasHeartIssues: user.hasHeartIssues || false,
      hasDiabetes: user.hasDiabetes || false,
      hasLungDisease: user.hasLungDisease || false,
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Health Profile</h1>
        <p className="text-muted-foreground">
          Personalize your health information to receive tailored air quality recommendations.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            This information helps us provide personalized health recommendations based on air quality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={user?.email || ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min={1}
                max={120}
                value={profile.age}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Health Conditions</h3>
            <p className="text-sm text-muted-foreground">
              Select any conditions that apply to you for more accurate health recommendations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="hasAsthma">Asthma</Label>
                <Switch
                  id="hasAsthma"
                  checked={profile.hasAsthma}
                  onCheckedChange={(checked) => handleSwitchChange("hasAsthma", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="isSmoker">Smoker</Label>
                <Switch
                  id="isSmoker"
                  checked={profile.isSmoker}
                  onCheckedChange={(checked) => handleSwitchChange("isSmoker", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="hasHeartIssues">Heart Disease</Label>
                <Switch
                  id="hasHeartIssues"
                  checked={profile.hasHeartIssues}
                  onCheckedChange={(checked) => handleSwitchChange("hasHeartIssues", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="hasDiabetes">Diabetes</Label>
                <Switch
                  id="hasDiabetes"
                  checked={profile.hasDiabetes}
                  onCheckedChange={(checked) => handleSwitchChange("hasDiabetes", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="hasLungDisease">Other Lung Conditions</Label>
                <Switch
                  id="hasLungDisease"
                  checked={profile.hasLungDisease}
                  onCheckedChange={(checked) => handleSwitchChange("hasLungDisease", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetProfile} disabled={loading}>
            Reset
          </Button>
          <Button onClick={saveProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Risk Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
          <CardDescription>
            View your personalized health risk timeline based on forecasted air quality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Based on your health profile and our air quality forecasts, we can estimate your personal risk levels over time. This helps you plan ahead and take precautions when needed.
          </p>
          
          {showingRiskTimeline ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="risk" name="Risk Index" stroke="#f43f5e" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Risk Assessment</h4>
                <p className="text-sm">Your risk index peaks during winter months due to increased pollution levels and your health profile. Consider taking extra precautions during these periods.</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button onClick={fetchRiskTimeline} disabled={loading}>
                {loading ? "Loading..." : "View Risk Timeline"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
