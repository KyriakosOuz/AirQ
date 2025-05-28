
import React from "react";
import { parseBoldText } from "@/lib/ai-tip-formatter";

interface BoldTextRendererProps {
  text: string;
  className?: string;
}

const BoldTextRenderer: React.FC<BoldTextRendererProps> = ({ text, className }) => {
  const parsedText = parseBoldText(text);
  
  return (
    <span className={className}>
      {parsedText.map((part, index) => (
        part.bold ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      ))}
    </span>
  );
};

export default BoldTextRenderer;
