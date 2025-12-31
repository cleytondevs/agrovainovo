import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2canvas from "html2canvas";

interface CommodityImageProps {
  commodities: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommodityImage({ commodities, isOpen, onClose }: CommodityImageProps) {
  const imageRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!imageRef.current) return;

    try {
      const canvas = await html2canvas(imageRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `commodities-preços-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle>Preços para Compartilhar</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={imageRef}
            className="w-full aspect-square rounded-lg overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2d5016 0%, #4a7c2c 50%, #6b9d3c 100%)",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              color: "white",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Logo Area */}
            <div
              style={{
                width: "120px",
                height: "120px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "14px", textAlign: "center" }}>
                LOGO
              </span>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "30px", textAlign: "center" }}>
              Preços de Commodities
            </h2>

            {/* Commodities Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                width: "100%",
                marginBottom: "30px",
              }}
            >
              {commodities.map((commodity, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                    {commodity.name}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    R${commodity.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    {commodity.unit}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: "12px",
                opacity: 0.8,
                textAlign: "center",
              }}
            >
              Atualizado em {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>

          <Button
            onClick={handleDownload}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar para WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
