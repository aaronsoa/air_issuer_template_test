import { FileText, Hexagon } from "lucide-react";
import { formatKey } from "@/lib/utils";

interface CredentialCardProps {
  title: string;
  source: string;
  data: Record<string, string | number | object | null>;
}

export function CredentialCard({ title, source, data }: CredentialCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-5)}`;
  };

  const dataEntries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined
  );

  return (
    <div className="w-full max-w-md border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">Credential to be stored</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Source</p>
          <p className="text-xs font-mono text-gray-700">
            {formatAddress(source)}
          </p>
        </div>
      </div>

      {/* Data Points */}
      {dataEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3">
            Contains {dataEntries.length} data point{dataEntries.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {dataEntries.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Hexagon className="w-4 h-4 text-gray-400 fill-gray-100" />
                  <span className="text-sm text-gray-700">{formatKey(key)}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 break-all text-right">
                  {typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

