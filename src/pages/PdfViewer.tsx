import { Navbar } from '@/components/layout/Navbar';
import { Download, ExternalLink } from 'lucide-react';

interface PdfViewerProps {
  title: string;
  file: string;
}

export const PdfViewer = ({ title, file }: PdfViewerProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-display text-foreground">{title}</h1>
          <div className="flex gap-2">
            <a
              href={file}
              download
              className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz PDF
            </a>
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Otwórz w nowej karcie
            </a>
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <iframe
            src={`${file}#view=FitH`}
            title={title}
            className="w-full h-[80vh] bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
