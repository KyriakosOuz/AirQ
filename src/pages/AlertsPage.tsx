
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

// Notification component for active alerts
const AlertNotification: React.FC<{ alert: Alert; onDelete: () => void }> = ({ alert, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 mb-2 bg-muted rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{alert.region}</div>
        <div className="text-sm text-muted-foreground">
          {alert.pollutant} - Alert when AQI is {alert.threshold} or worse
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Cross2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
      const response = await alertApi.list();
      
      if (response.success && response.data) {
        // Safely handle the response data
        const safeData = Array.isArray(response.data) ? response.data : [];
        setAlerts(safeData as Alert[]);
      } else {
        toast.error("Failed to load alerts");
        // Use empty array as fallback
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Failed to load alerts");
      setAlerts([]);
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
      // Convert AQI level to display string for backend
      const thresholdLabel = aqiLevelLabels[newAlert.threshold];
      
      const response = await alertApi.subscribe({
        region: newAlert.region,
        pollutant: newAlert.pollutant,
        threshold: thresholdLabel
      });
      
      if (response.success) {
        toast.success("Alert subscription created");
        loadAlerts(); // Refresh the list
      } else {
        toast.error("Failed to create alert subscription");
      }
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
      const response = await alertApi.delete(alertId);
      
      if (response.success) {
        toast.success("Alert subscription removed");
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      } else {
        toast.error("Failed to remove alert subscription");
      }
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
      const response = await alertApi.checkAlerts(true); // true = send email
      
      if (response.success) {
        toast.success("Alerts checked and notifications sent if needed");
      } else {
        toast.error("Failed to check alerts");
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Alerts */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Your Alert Subscriptions</CardTitle>
            <CardDescription>
              You'll receive notifications when these conditions are met
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
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
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={checkAlerts}
                    disabled={loading}
                  >
                    Check Alerts Now
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;
