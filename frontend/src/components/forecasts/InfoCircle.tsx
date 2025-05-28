
import React from "react";
import { Info } from "lucide-react";

// Simple wrapper for Info icon to reuse as InfoCircle
export const InfoCircle: React.FC<React.ComponentProps<typeof Info>> = (props) => {
  return <Info {...props} />;
};

export default InfoCircle;
