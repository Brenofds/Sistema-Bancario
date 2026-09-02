import React, { useRef, useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';

export function ReceiptScanner({ onScanned }: { onScanned: (data: any) => void }) {
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScanning(true);
      
      const formData = new FormData();
      formData.append('receipt', file);

      try {
        const res = await fetch('/api/analyze-receipt', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data && data.amount) {
          onScanned(data);
        } else {
          alert('Não foi possível ler o recibo.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao analisar o recibo.');
      } finally {
        setScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-[22px] bg-white/5 transition-colors hover:bg-white/10">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      
      {scanning ? (
        <div className="flex flex-col items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-400" />
          <p className="text-sm font-medium text-slate-300">Analisando fatura com IA...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-3 cursor-pointer hover:bg-blue-500/30 transition-colors" onClick={() => fileInputRef.current?.click()}>
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-white mb-1">Escanear Recibo ou Fatura</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-[200px]">Tire uma foto ou faça upload para categorizar automaticamente.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 shadow-sm rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Escolher Imagem
          </button>
        </div>
      )}
    </div>
  );
}
