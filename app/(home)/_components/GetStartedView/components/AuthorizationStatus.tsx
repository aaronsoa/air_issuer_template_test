import { Check, Loader2 } from "lucide-react";

interface AuthorizationStatusProps {
  isAuthorized: boolean;
  walletAddress?: string;
}

export function AuthorizationStatus({
  isAuthorized,
  walletAddress,
}: AuthorizationStatusProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-5)}`;
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span>Not Authorized Yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
        <Check className="w-3 h-3 text-white" />
      </div>
      <span className="font-medium text-gray-900">
        {walletAddress ? formatAddress(walletAddress) : ""}
      </span>
      <span className="text-green-600 font-medium">Authorized</span>
    </div>
  );
}

