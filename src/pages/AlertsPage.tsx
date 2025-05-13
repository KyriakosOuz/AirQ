
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { alertApi } from "@/lib/api";
import { Alert, Pollutant, AqiLevel } from "@/lib/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AqiBadge } from "@/components/ui/aqi-badge";
import { getAqiLevelFromValue } from "@/lib/types";
import { Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AlertsPage: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("NO2");
  const [threshold, setThreshold] = useState<string>("Moderate");
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Available thresholds matching the backend requirements
  const thresholdOptions = [
    "Good",
    "Moderate", 
    "Unhealthy for Sensitive Groups", 
    "Unhealthy", 
    "Very Unhealthy",
    "Hazardous"
  ];
  
  // Load alerts from API on component mount
  useEffect(() => {
    fetchAlerts();
  }, []);
  
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertApi.list();
      
      if (response.success && response.data) {
        setAlerts(response.data);
        toast.success("Alerts loaded");
      } else {
        console.error("Failed to fetch alerts:", response.error);
        toast.error("Failed to load alerts");
        
        // Use mock data if API fails
        const mockAlerts: Alert[] = [
          {
            id: "1",
            userId: "user-123",
            region: "thessaloniki",
            pollutant: "NO2",
            threshold: "Unhealthy",
            active: true,
            createdAt: "2024-05-01T12:00:00Z",
          },
          {
            id: "2",
            userId: "user-123",
            region: "kalamaria",
            pollutant: "O3",
            threshold: "Moderate",
            active: true,
            createdAt: "2024-05-02T10:30:00Z",
          },
        ];
        
        setAlerts(mockAlerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };
  
  const createAlert = async () => {
    setLoading(true);
    try {
      const response = await alertApi.subscribe({
        region,
        pollutant,
        threshold
      });
      
      if (response.success) {
        toast.success(`Alert created for ${pollutant} in ${region}`);
        // Refresh alerts list
        fetchAlerts();
      } else {
        toast.error(response.error || "Failed to create alert");
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };
  
  const deleteAlert = async (alertId: string) => {
    setLoading(true);
    try {
      const response = await alertApi.delete(alertId);
      
      if (response.success) {
        // Remove from local state
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.success("Alert deleted");
      } else {
        toast.error(response.error || "Failed to delete alert");
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    } finally {
      setLoading(false);
    }
  };
  
  // Get region label from value
  const getRegionLabel = (regionValue: string): string => {
    const regionMap: Record<string, string> = {
      "thessaloniki": "Thessaloniki Center",
      "kalamaria": "Kalamaria",
      "pavlos-melas": "Pavlos Melas",
      "neapoli-sykies": "Neapoli-Sykies",
      "ampelokipoi-menemeni": "Ampelokipoi-Menemeni",
      "panorama": "Panorama",
      "pylaia-chortiatis": "Pylaia-Chortiatis",
    };
    
    return regionMap[regionValue] || regionValue;
  };
  
  // Get pollutant label from value
  const getPollutantLabel = (pollutantValue: Pollutant): string => {
    const pollutantMap: Record<Pollutant, string> = {
      "NO2": "Nitrogen Dioxide (NO₂)",
      "O3": "Ozone (O₃)",
      "SO2": "Sulfur Dioxide (SO₂)",
    };
    
    return pollutantMap[pollutantValue] || pollutantValue;
  };
  
  // Format date helper function
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Get AQI level badge for threshold
  const getThresholdBadge = (thresholdValue: string): JSX.Element => {
    // Map backend threshold string to our AqiLevel type
    const thresholdToAqiMap: Record<string, AqiLevel> = {
      "Good": "good",
      "Moderate": "moderate",
      "Unhealthy for Sensitive Groups": "unhealthy-sensitive",
      "Unhealthy": "unhealthy",
      "Very Unhealthy": "very-unhealthy",
      "Hazardous": "hazardous"
    };
    
    const level = thresholdToAqiMap[thresholdValue] || "moderate";
    return <AqiBadge level={level} />;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AQI Alerts</h1>
        <p className="text-muted-foreground">
          Set up notifications when air quality exceeds your thresholds.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Get notified when pollutant levels exceed your threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <RegionSelector value={region} onValueChange={setRegion} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pollutant">Pollutant</Label>
              <PollutantSelector value={pollutant} onValueChange={setPollutant} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold Level</Label>
              <Select value={threshold} onValueChange={setThreshold}>
                <SelectTrigger>
                  <SelectValue placeholder="Select threshold" />
                </SelectTrigger>
                <SelectContent>
                  {thresholdOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      <div className="flex items-center gap-2">
                        {option}
                        {getThresholdBadge(option)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                You'll be notified when air quality reaches this level
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={createAlert}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Alert"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>
              Your current AQI alert subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Pollutant</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{getRegionLabel(alert.region)}</TableCell>
                      <TableCell>{alert.pollutant}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {alert.threshold}
                          {getThresholdBadge(alert.threshold)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(alert.createdAt)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash size={16} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No alerts set up yet</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              You will receive notifications when air quality exceeds your thresholds
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>How Alerts Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">1. Set Your Threshold</h3>
              <p className="text-sm text-muted-foreground">
                Choose the pollutant level at which you want to receive alerts.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">2. Monitor Air Quality</h3>
              <p className="text-sm text-muted-foreground">
                Our system continuously checks current pollutant levels in your selected regions.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">3. Receive Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Get email or push notifications when pollutant levels exceed your thresholds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;
