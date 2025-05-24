
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Activity, AlertTriangle, Ban, Clock, Droplets, Eye, Home, Pill, Stethoscope, TreePine } from "lucide-react";
import { parseAITip, getUrgencyColor, ParsedTipSection } from "@/lib/ai-tip-formatter";
import { cn } from "@/lib/utils";

interface FormattedAITipProps {
  tipText: string;
  className?: string;
}

// Icon mapping
const ICON_COMPONENTS = {
  'Activity': Activity,
  'AlertTriangle': AlertTriangle,
  'Ban': Ban,
  'Clock': Clock,
  'Droplets': Droplets,
  'Eye': Eye,
  'Home': Home,
  'Pill': Pill,
  'Stethoscope': Stethoscope,
  'TreePine': TreePine,
};

const FormattedAITip: React.FC<FormattedAITipProps> = ({ tipText, className }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const parsedTip = parseAITip(tipText);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName || !ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS]) {
      return null;
    }
    const IconComponent = ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS];
    return <IconComponent className="h-4 w-4 flex-shrink-0" />;
  };

  const renderSection = (section: ParsedTipSection, index: number) => {
    const urgencyColors = getUrgencyColor(section.urgency || 'low');
    const isExpanded = expandedSections.has(index);
    const isLongContent = section.content.length > 100;

    switch (section.type) {
      case 'numbered':
        return (
          <div key={index} className={cn("border rounded-lg p-3 mb-3", urgencyColors)}>
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="bg-white text-sm font-semibold px-2 py-1 rounded">
                  {index + 1}
                </span>
                {renderIcon(section.icon)}
              </div>
              <div className="flex-1 min-w-0">
                {isLongContent ? (
                  <Collapsible open={isExpanded} onOpenChange={() => toggleSection(index)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed">
                        {isExpanded ? section.content : `${section.content.substring(0, 100)}...`}
                      </p>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      {isExpanded && (
                        <p className="text-sm leading-relaxed mt-2">
                          {section.content.substring(100)}
                        </p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <p className="text-sm leading-relaxed">{section.content}</p>
                )}
                {section.urgency === 'high' && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );

      case 'emphasis':
        return (
          <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <p className="text-sm font-medium text-purple-800 leading-relaxed">
                {section.content}
              </p>
            </div>
          </div>
        );

      case 'bullet':
        return (
          <div key={index} className={cn("border rounded-lg p-3 mb-2", urgencyColors)}>
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-current" />
                {renderIcon(section.icon)}
              </div>
              <p className="text-sm leading-relaxed flex-1">{section.content}</p>
            </div>
          </div>
        );

      default:
        return (
          <div key={index} className="mb-3">
            <p className="text-sm leading-relaxed text-gray-700">{section.content}</p>
          </div>
        );
    }
  };

  if (!parsedTip.sections.length) {
    return (
      <div className={className}>
        <p className="text-sm leading-relaxed text-gray-700">{tipText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary Section */}
      {parsedTip.summary && (
        <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-purple-900 mb-2">Key Recommendation</h4>
          <p className="text-sm text-purple-800 leading-relaxed">{parsedTip.summary}</p>
        </div>
      )}

      {/* Detailed Sections */}
      <div className="space-y-1">
        {parsedTip.sections.map((section, index) => renderSection(section, index))}
      </div>
    </div>
  );
};

export default FormattedAITip;
