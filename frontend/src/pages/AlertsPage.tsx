
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { alertApi, metadataApi } from "@/lib/api";
import { Alert, Pollutant, AqiLevel, aqiLevelLabels } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Cross2Icon } from "@radix-ui/react-icons";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/utils";

// Mockup data for demonstration
const MOCKUP_ALERTS: Alert[] = [
  {
    id: "alert-1",
    user_id: "user-123",
    region: "thessaloniki",
    pollutant: "NO2" as Pollutant,
    threshold: "Unhealthy for Sensitive Groups",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "alert-2",
    user_id: "user-123",
    region: "athens",
    pollutant: "pollution" as Pollutant,
    threshold: "Moderate",
    created_at: "2024-01-10T14:20:00Z"
  },
  {
    id: "alert-3",
    user_id: "user-123",
    region: "patras",
    pollutant: "O3" as Pollutant,
    threshold: "Unhealthy",
    created_at: "2024-01-08T09:15:00Z"
  },
  {
    id: "alert-4",
    user_id: "user-123",
    region: "volos",
    pollutant: "SO2" as Pollutant,
    threshold: "Very Unhealthy",
    created_at: "2024-01-05T16:45:00Z"
  }
];

// Notification component for active alerts
const AlertNotification: React.FC<{ alert: Alert; onDelete: () => void }> = ({ alert, onDelete }) => {
  const formatRegionName = (region: string) => {
    return region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ');
  };

  const formatPollutantName = (pollutant: string) => {
    const pollutantNames: Record<string, string> = {
      'pollution': 'General Pollution',
      'NO2': 'Nitrogen Dioxide',
      'O3': 'Ozone',
      'SO2': 'Sulfur Dioxide',
      'CO': 'Carbon Monoxide',
      'NO': 'Nitric Oxide'
    };
    return pollutantNames[pollutant] || pollutant;
  };

  return (
    <div className="flex items-center justify-between p-4 mb-2 bg-muted rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{formatRegionName(alert.region)}</div>
        <div className="text-sm text-muted-foreground">
          {formatPollutantName(alert.pollutant)} - Alert when AQI is {alert.threshold} or worse
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Created: {new Date(alert.created_at || '').toLocaleDateString()}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Cross2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCKUP_ALERTS);
  const [loading, setLoading] = useState(false);
  const [newAlert, setNewAlert] = useState({
    region: "thessaloniki",
    pollutant: "NO2" as Pollutant,
    threshold: "moderate" as AqiLevel,
  });

  // Load user's existing alert subscriptions
  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll use mockup data
      console.log("Loading alerts (using mockup data)");
      setAlerts(MOCKUP_ALERTS);
      toast.success("Alerts loaded successfully (demo data)");
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Failed to load alerts");
      setAlerts(MOCKUP_ALERTS); // Fallback to mockup data
    } finally {
      setLoading(false);
    }
  };

  // Load alerts on component mount
  useEffect(() => {
    loadAlerts();
  }, []);

  // Create a new alert subscription
  const createAlert = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Convert AQI level to display string for backend
      const thresholdLabel = aqiLevelLabels[newAlert.threshold];
      
      // Create new alert with mockup data
      const newAlertData: Alert = {
        id: `alert-${Date.now()}`,
        user_id: "user-123",
        region: newAlert.region,
        pollutant: newAlert.pollutant,
        threshold: thresholdLabel,
        created_at: new Date().toISOString()
      };
      
      setAlerts(prev => [...prev, newAlertData]);
      toast.success("Alert subscription created successfully (demo)");
      
      // Reset form
      setNewAlert({
        region: "thessaloniki",
        pollutant: "NO2" as Pollutant,
        threshold: "moderate" as AqiLevel,
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert subscription");
    } finally {
      setLoading(false);
    }
  };

  // Delete an alert subscription
  const deleteAlert = async (alertId: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast.success("Alert subscription removed successfully (demo)");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to remove alert subscription");
    } finally {
      setLoading(false);
    }
  };

  // Check for current alerts (manual trigger)
  const checkAlerts = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate finding some triggered alerts
      const triggeredAlerts = Math.floor(Math.random() * 3); // 0-2 triggered alerts
      
      if (triggeredAlerts === 0) {
        toast.success("All air quality levels are within acceptable ranges");
      } else {
        toast.warning(`${triggeredAlerts} alert(s) triggered! Notifications sent (demo)`);
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
      toast.error("Failed to check alerts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Alerts</h1>
        <p className="text-muted-foreground">
          Set up notifications for when air quality reaches concerning levels.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> This page is currently showing mockup data to demonstrate the alerts functionality. 
            All actions are simulated and no real notifications will be sent.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Alerts */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Your Alert Subscriptions ({alerts.length})</CardTitle>
            <CardDescription>
              You'll receive notifications when these conditions are met
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && alerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Loading your alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>You don't have any alert subscriptions yet.</p>
                <p className="text-sm mt-2">Create one using the form on the right.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <AlertNotification 
                    key={alert.id} 
                    alert={alert} 
                    onDelete={() => deleteAlert(alert.id)} 
                  />
                ))}
                
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={checkAlerts}
                    disabled={loading}
                  >
                    {loading ? "Checking..." : "Check Alerts Now"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={loadAlerts}
                    disabled={loading}
                  >
                    {loading ? "Refreshing..." : "Refresh Alerts"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Create New Alert */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Get notified when air quality reaches concerning levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <RegionSelector 
                  value={newAlert.region} 
                  onValueChange={(value) => setNewAlert({...newAlert, region: value})} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Pollutant</Label>
                <PollutantSelector 
                  value={newAlert.pollutant} 
                  onValueChange={(value) => setNewAlert({...newAlert, pollutant: value})} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Alert Threshold</Label>
                <Select 
                  value={newAlert.threshold}
                  onValueChange={(value) => setNewAlert({...newAlert, threshold: value as AqiLevel})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="unhealthy-sensitive">Unhealthy for Sensitive Groups</SelectItem>
                    <SelectItem value="unhealthy">Unhealthy</SelectItem>
                    <SelectItem value="very-unhealthy">Very Unhealthy</SelectItem>
                    <SelectItem value="hazardous">Hazardous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full" 
                onClick={createAlert}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Alert Subscription"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>About Air Quality Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Our alert system monitors air quality levels in your selected regions and notifies you when pollutant levels reach or exceed your specified thresholds.
            </p>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Alert Thresholds Explained:</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="font-medium">Moderate:</span> Air quality is acceptable, but there may be some risk for people who are unusually sensitive to air pollution.</li>
                <li><span className="font-medium">Unhealthy for Sensitive Groups:</span> Members of sensitive groups may experience health effects, but the general public is less likely to be affected.</li>
                <li><span className="font-medium">Unhealthy:</span> Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.</li>
                <li><span className="font-medium">Very Unhealthy:</span> Health alert: everyone may experience more serious health effects.</li>
                <li><span className="font-medium">Hazardous:</span> Health warnings of emergency conditions. The entire population is more likely to be affected.</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Sample Alert Scenarios:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• "Thessaloniki NO2 levels reached Unhealthy - consider limiting outdoor activities"</li>
                <li>• "Athens general pollution index is now Moderate - sensitive individuals should be cautious"</li>
                <li>• "Patras ozone levels are Very Unhealthy - avoid outdoor exercise"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;
