import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { useAirkit } from "@/lib/hooks/useAirkit";
import { useSession } from "@/lib/hooks/useSession";
import { formatKey, getNameFromAccessToken } from "@/lib/utils";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useUserData } from "../hooks";
import { StepCounter } from "./StepCounter";

export function IssuanceModal() {
  const { airService, isInitialized } = useAirkit();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  const { data: userData, isError, refetch } = useUserData();
  const { accessToken, setAccessToken } = useSession();
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showInfoNote, setShowInfoNote] = useState(false);
  let name = getNameFromAccessToken(accessToken);
  const isWalletLogin = env.NEXT_PUBLIC_AUTH_METHOD === "wallet";
  const isAirKitLogin = env.NEXT_PUBLIC_AUTH_METHOD === "airkit";

  const issueCredential = async ({
    response,
    jwt,
  }: {
    response: Record<string, object | string | number | null>;
    jwt: string;
  }) => {
    setIsWidgetLoading(true);
    try {
      // Clean the credentialSubject: remove null, undefined, and ensure only valid values
      const credentialSubject: Record<string, string | number> = {};
      for (const key in response) {
        const value = response[key];
        // Only include defined, non-null values that are strings or numbers
        if (value !== null && value !== undefined) {
          if (typeof value === 'string' || typeof value === 'number') {
            credentialSubject[key] = value;
          } else if (typeof value === 'object' && !Array.isArray(value)) {
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

      await issueCredential({ response: response as Record<string, string | number | object | null>, jwt });
    } catch (error) {
      console.error(error);
    }
  };

  const isLoading = isWidgetLoading || !isInitialized;
  const loadingText = !isInitialized ? "Initializing..." : "Loading...";
  const response = userData?.response;

  const handleConfirmInfoNote = () => {
    setShowInfoNote(false);
    onContinue();
  };

  // Calculate current step based on state
  const { currentStep, totalSteps } = useMemo(() => {
    const total = 4;
    let current = 1;

    if (isSuccess) {
      current = 4; // Success step
    } else if (showInfoNote && accessToken && response) {
      current = 3; // Confirmation step
    } else if (accessToken && response) {
      current = 2; // Data preview step
    } else {
      current = 1; // Initial/Login step
    }

    return { currentStep: current, totalSteps: total };
  }, [isSuccess, showInfoNote, accessToken, response]);

  if (isSuccess) {
    return (
      <div className="w-full max-w-[420px] flex flex-col gap-4 items-center">
        <StepCounter currentStep={currentStep} totalSteps={totalSteps} />
        <div className="text-sm text-center">
          🎉 Congrats! You have successfully stored your data securely.
        </div>
      </div>
    );
  }

  // Show info note screen (Step 3) when user clicks Continue from data preview
  if (showInfoNote && accessToken && response) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <StepCounter currentStep={currentStep} totalSteps={totalSteps} />
        <div className="text-2xl font-bold">{env.NEXT_PUBLIC_HEADLINE}</div>
        <div className="text-sm text-muted-foreground text-center max-w-[420px]">
          This step says to use this wallet for issuing an air credential to your account.
        </div>
        <Button
          className="w-full max-w-[200px]"
          size="lg"
          onClick={handleConfirmInfoNote}
        >
          Confirm
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <StepCounter currentStep={currentStep} totalSteps={totalSteps} />
      <div className="text-2xl font-bold">{env.NEXT_PUBLIC_HEADLINE}</div>

      {isError ? (
        <div className="w-full max-w-[420px] text-sm text-destructive text-center">
          Failed to load user data. Please try again.
        </div>
      ) : (
        <>
          {response && (
            <>
              <div className="text-sm text-muted-foreground">
                {name && <>Welcome, {name}!</>}
              </div>
              <div className="space-y-0 text-center">
                {Object.entries(response).map(([key, value]) => (
                  <div key={key}>
                    {formatKey(key)}: {value ?? "N/A"}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {isError ? (
        <Button
          className="w-full max-w-[200px]"
          size="lg"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      ) : (
        <Button
          className="w-full max-w-[200px]"
          size="lg"
          onClick={() => {
            if (accessToken && response) {
              setShowInfoNote(true);
            } else {
              onContinue();
            }
          }}
          isLoading={isLoading}
        >
          {isLoading
            ? loadingText
            : accessToken
            ? "Continue"
            : isWalletLogin
            ? "Connect Wallet"
            : "Login"}
        </Button>
      )}
    </div>
  );
}
