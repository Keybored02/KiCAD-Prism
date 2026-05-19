import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
    url: string;
    filename: string;
    downloadUrl: string;
    onClose: () => void;
}

export function PdfViewer({ url, filename, downloadUrl, onClose }: PdfViewerProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur"
            role="dialog"
            aria-modal="true"
            aria-label={filename}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-background shrink-0">
                <span className="flex-1 text-sm font-medium truncate text-foreground">{filename}</span>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open tab
                </a>
                <a
                    href={downloadUrl}
                    download
                    title="Download"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                    <Download className="h-3.5 w-3.5" />
                    Download
                </a>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-7 w-7 p-0"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* PDF iframe */}
            <iframe
                src={url}
                className="flex-1 w-full border-0"
                title={filename}
            />
        </div>
    );
}
