
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ChartExportButtonProps {
  data: any[];
  chartType: 'trend' | 'seasonal' | 'top-polluted';
  pollutant: string;
  region?: string;
  year?: number;
}

export const ChartExportButton: React.FC<ChartExportButtonProps> = ({
  data,
  chartType,
  pollutant,
  region,
  year
}) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    let csvContent = '';
    let filename = '';

    if (chartType === 'trend') {
      csvContent = 'Date,Value,Delta\n';
      data.forEach(item => {
        csvContent += `${item.year || item.date},${item.value},${item.delta || 0}\n`;
      });
      filename = `${pollutant}_trend_${region}_${year}.csv`;
    } else if (chartType === 'seasonal') {
      csvContent = 'Month,Value\n';
      data.forEach(item => {
        csvContent += `${item.month},${item.value}\n`;
      });
      filename = `${pollutant}_seasonality_${region}_${year}.csv`;
    } else if (chartType === 'top-polluted') {
      csvContent = 'Region,Value\n';
      data.forEach(item => {
        csvContent += `${item.name},${item.value}\n`;
      });
      filename = `${pollutant}_top_polluted_${year}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  const exportToPNG = () => {
    // Find the chart container
    const chartContainer = document.querySelector('.recharts-wrapper');
    if (!chartContainer) {
      toast.error('Chart not found for export');
      return;
    }

    // Get the SVG element
    const svgElement = chartContainer.querySelector('svg');
    if (!svgElement) {
      toast.error('Chart SVG not found');
      return;
    }

    // Create a canvas and draw the SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Convert SVG to data URL - access XMLSerializer through window
    const serializer = new (window as any).XMLSerializer();
    const svgData = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `${pollutant}_${chartType}_chart_${region || ''}_${year || ''}.png`;
          link.click();
          URL.revokeObjectURL(pngUrl);
          toast.success('Chart exported as PNG');
        }
      });
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPNG}>
          <Image className="h-4 w-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
