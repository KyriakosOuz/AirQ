
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Play, Loader } from "lucide-react";

interface TrainModelCardProps {
  trainRegion: string;
  setTrainRegion: (value: string) => void;
  trainPollutant: Pollutant;
  setTrainPollutant: (value: Pollutant) => void;
  trainLoading: boolean;
  onTrainModel: () => void;
}

const TrainModelCard: React.FC<TrainModelCardProps> = ({
  trainRegion,
  setTrainRegion,
  trainPollutant,
  setTrainPollutant,
  trainLoading,
  onTrainModel,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Train Forecast Model</CardTitle>
        <CardDescription>
          Start model training for a specific pollutant in a region
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Region</Label>
          <RegionSelector value={trainRegion} onValueChange={setTrainRegion} />
        </div>
        <div className="space-y-2">
          <Label>Pollutant</Label>
          <PollutantSelector value={trainPollutant} onValueChange={setTrainPollutant} />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onTrainModel} 
          disabled={trainLoading}
          className="w-full"
        >
          {trainLoading ? (
            <>
              <Loader size={20} className="mr-2 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Play size={20} className="mr-2" />
              Start Training
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrainModelCard;
