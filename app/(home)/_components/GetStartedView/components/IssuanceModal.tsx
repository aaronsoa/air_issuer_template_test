import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { useAirkit } from "@/lib/hooks/useAirkit";
import { useSession } from "@/lib/hooks/useSession";
import { formatKey, getNameFromAccessToken } from "@/lib/utils";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useUserData } from "../hooks";
import { AuthorizationStatus } from "./AuthorizationStatus";
import { CredentialCard } from "./CredentialCard";

interface IssuanceModalProps {
  currentStep: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
}

export function IssuanceModal({ currentStep, onStepChange }: IssuanceModalProps) {
  const { airService, isInitialized } = useAirkit();
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { data: userData, isError, refetch } = useUserData();
  const { accessToken, setAccessToken } = useSession();
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  let name = getNameFromAccessToken(accessToken);
  const isWalletLogin = env.NEXT_PUBLIC_AUTH_METHOD === "wallet";
  const isAirKitLogin = env.NEXT_PUBLIC_AUTH_METHOD === "airkit";

  // Auto-progress to step 2 when wallet is connected and accessToken exists
  useEffect(() => {
    if (isConnected && accessToken && currentStep === 1) {
      onStepChange(2);
    }
  }, [isConnected, accessToken, currentStep, onStepChange]);

  const issueCredential = async ({
    response,
    jwt,
  }: {
    response: Record<string, object | string | number | null>;
    jwt: string;
  }) => {
    setIsWidgetLoading(true);
    // Clean the credentialSubject: remove null, undefined, and ensure only valid values
    const credentialSubject: Record<string, string | number> = {};
    try {
      for (const key in response) {
        const value = response[key];
        // Only include defined, non-null values that are strings or numbers
        if (value !== null && value !== undefined) {
          if (typeof value === "string" || typeof value === "number") {
            credentialSubject[key] = value;
          } else if (typeof value === "object" && !Array.isArray(value)) {
            // For objects, stringify them
            credentialSubject[key] = JSON.stringify(value);
          }
        }
      }

      // Log what we're sending for debugging
      console.log("Issuing credential with:", {
        credentialId: env.NEXT_PUBLIC_ISSUE_PROGRAM_ID,
        credentialSubject,
        issuerDid: env.NEXT_PUBLIC_ISSUER_DID,
      });

      await airService.issueCredential({
        authToken: jwt,
        credentialId: env.NEXT_PUBLIC_ISSUE_PROGRAM_ID,
        credentialSubject,
        issuerDid: env.NEXT_PUBLIC_ISSUER_DID,
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error issuing credential:", error);
      console.error("Credential subject that failed:", credentialSubject);
      throw error;
    } finally {
      setIsWidgetLoading(false);
    }
  };

  const onContinue = async () => {
    try {
      if (isWalletLogin) {
        if (!accessToken || !isConnected) {
          openConnectModal?.();
          return;
        }
      }

      while (!airService.isLoggedIn) {
        await airService.login();
      }

      if (isAirKitLogin && !accessToken) {
        try {
          const airkitToken = await airService.getAccessToken();
          const name = (await airService.getUserInfo())?.user?.email;

          const verifyRes = await fetch("/api/auth/airkit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${airkitToken.token}`,
            },
            body: JSON.stringify({ name }),
          });

          const data = (await verifyRes.json()) as {
            accessToken: string;
            walletAddress: string;
          };

          if (!data.accessToken) {
            throw new Error("Invalid login");
          }
          setAccessToken(data.accessToken);
          await refetch();
        } catch (error) {
          console.error(error);
          throw error;
        }
      }

      name = getNameFromAccessToken(accessToken);

      if (!userData) {
        throw new Error("No user data");
      }

      const { response, jwt } = userData;

      await issueCredential({
        response: response as Record<string, string | number | object | null>,
        jwt,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const isLoading = isWidgetLoading || !isInitialized;
  const loadingText = !isInitialized ? "Initializing..." : "Loading...";
  const response = userData?.response;

  // Success state
  if (isSuccess) {
    return (
      <div className="w-full max-w-[420px] text-sm text-center">
        🎉 Congrats! You have successfully stored your data securely.
      </div>
    );
  }

  // Step 1: Authorization / Login
  if (currentStep === 1) {
    return (
      <div className="flex flex-col gap-8 items-center max-w-lg px-4">
        <div className="text-sm text-gray-500 text-center">
          Securely store your data on Moca Chain
        </div>

        <h1 className="text-4xl font-bold text-center text-gray-900 leading-tight">
          Please login to your Mocaverse account to get started
        </h1>

        <AuthorizationStatus
          isAuthorized={isConnected && !!accessToken}
          walletAddress={address}
        />

        <Button
          className="w-full max-w-[200px] bg-black hover:bg-gray-800 rounded-full font-medium"
          size="lg"
          onClick={() => {
            if (isWalletLogin) {
              openConnectModal?.();
            } else {
              onContinue();
            }
          }}
          isLoading={isLoading}
        >
          {isLoading
            ? loadingText
            : isWalletLogin
            ? "Connect Wallet"
            : "Login"}
        </Button>
      </div>
    );
  }

  // Step 2: Credential Preview & Confirmation
  return (
    <div className="flex flex-col gap-6 items-center max-w-lg px-4">
      <div className="text-sm text-gray-500 text-center">
        Securely store your data on Moca Chain
      </div>

      <h1 className="text-4xl font-bold text-center text-gray-900 leading-tight">
        Confirm to store below credential on Moca Network
      </h1>

      {isError ? (
        <div className="w-full max-w-[420px] text-sm text-destructive text-center">
          Failed to load user data. Please try again.
        </div>
      ) : (
        <>
          {response && (
            <CredentialCard
              title="Mocaverse Credential"
              source={address || "Unknown"}
              data={response as Record<string, string | number | object | null>}
            />
          )}

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </div>

          {/* Moca Chain Account Info */}
          <div className="flex items-center justify-between w-full max-w-md p-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Moca Chain</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Account</p>
              <p className="text-sm text-gray-900 font-medium">{name || "User"}</p>
            </div>
          </div>

          {/* Authorization Status */}
          <AuthorizationStatus
            isAuthorized={isConnected && !!accessToken}
            walletAddress={address}
          />
        </>
      )}

      {isError ? (
        <Button
          className="w-full max-w-[200px] bg-black hover:bg-gray-800 rounded-full font-medium"
          size="lg"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      ) : (
        <Button
          className="w-full max-w-[200px] bg-black hover:bg-gray-800 rounded-full font-medium"
          size="lg"
          onClick={onContinue}
          isLoading={isLoading}
        >
          {isLoading ? loadingText : "Confirm"}
        </Button>
      )}
    </div>
  );
}
