
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

const AlertsPage: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("NO2");
  const [threshold, setThreshold] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Initialize with mock alerts
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: "1",
        userId: "user-123",
        region: "thessaloniki",
        pollutant: "NO2",
        threshold: 120,
        active: true,
        createdAt: "2024-05-01T12:00:00Z",
      },
      {
        id: "2",
        userId: "user-123",
        region: "kalamaria",
        pollutant: "O3",
        threshold: 100,
        active: true,
        createdAt: "2024-05-02T10:30:00Z",
      },
    ];
    
    setAlerts(mockAlerts);
  }, []);
  
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // In real app: const response = await alertApi.list();
      // if (response.success) {
      //   setAlerts(response.data);
      // }
      
      // For demo, we'll use the existing mock data
      toast.success("Alerts loaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };
  
  const createAlert = async () => {
    if (threshold < 1) {
      toast.error("Threshold must be greater than 0");
      return;
    }
    
    setLoading(true);
    try {
      // In real app: const response = await alertApi.subscribe({
      //   region,
      //   pollutant,
      //   threshold,
      // });
      
      // For demo, simulate creating a new alert
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        userId: "user-123",
        region,
        pollutant,
        threshold,
        active: true,
        createdAt: new Date().toISOString(),
      };
      
      setAlerts(prev => [newAlert, ...prev]);
      toast.success(`Alert created for ${pollutant} in ${region}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };
  
  const deleteAlert = async (alertId: string) => {
    setLoading(true);
    try {
      // In real app: const response = await alertApi.delete(alertId);
      
      // For demo, remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success("Alert deleted");
    } catch (error) {
      console.error(error);
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
              <Label htmlFor="threshold">Threshold (μg/m³)</Label>
              <Input 
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                min={1}
              />
              <p className="text-sm text-muted-foreground">
                Alert level: <AqiBadge level={getAqiLevelFromValue(threshold, pollutant)} />
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={createAlert}
              disabled={loading || threshold < 1}
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
                          {alert.threshold} μg/m³
                          <AqiBadge level={getAqiLevelFromValue(alert.threshold, alert.pollutant)} />
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
