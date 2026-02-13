"use client";
 
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
 
export default function UaepassCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  //const pathname = usePathname();
 
  // Keep locale for future use, disable ESLint warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //const locale = pathname.split("/")[1];
 
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
 
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
 
    if (error === "cancelledOnApp" ||error === "access_denied"|| error === "invalid_request" || error === "login_required") {
      setErrorMessage("cancelledOnApp");
      setShowErrorPopup(true);
      setStatus("error");
      return;
    }
 
    if (!code || !state) {
      setErrorMessage("somethingHappened");
      setShowErrorPopup(true);
      setStatus("error");
      return;
    }
 
    (async () => {
      setStatus("sending");
 
      try {
        const result = await signIn("uaepass", {
          redirect: false,
          code,
          state,
          rememberMe: true
        });
 
        if (result?.error) {
          if (result.error === "usernotfound" ) {
            setErrorMessage("restricted");
          }
          else if (result.error === "userinactive") {
            setErrorMessage("restricted");
          } 
          else if (result.error === "sop1userfound") {
            setErrorMessage("sop1userfound");
          }
          else if( result.error === "newusercreated") {
            
            setErrorMessage("restricted");
          }
          else if( result.error === "userinactive") {
            setErrorMessage("userinactive");
          }
          
          else {
            setErrorMessage(result.error);
          }
          setShowErrorPopup(true);
          setStatus("error");
        } else {
          setStatus("ok");
          const storedValue = localStorage.getItem("locale-storage");
          if (storedValue) {
          // Decode the stored value (it's URL-encoded)
        const decoded = decodeURIComponent(storedValue || "");
        console.log("Decoded locale value:", decoded);
        // Parse JSON
        const parsed = JSON.parse(decoded);
        console.log("Parsed locale object:", parsed);
        // Get locale value
        const locale = parsed?.state?.locale || "en"; // fallback to 'en'
        console.log("Determined locale:", locale);
        // Redirect
        router.push(`/${locale}/dashboard`);
          } else {
            router.push(`/en/dashboard`);
          }
        }
      } catch (err: any) {
        if (err?.message === "usernotfound") {
          setErrorMessage("restricted");
        }else if(err?.message === "userinactive"){
          setErrorMessage("restricted");
        } else {
          setErrorMessage(err?.message || "Unexpected error. Please try again.");
        }
        setShowErrorPopup(true);
        setStatus("error");
      }
    })();
  }, [router, searchParams]);
 
  const handleClosePopup = () => {
    setShowErrorPopup(false);
    router.push(`/`);
  };
 
  return (
<main className="flex flex-col items-center justify-center p-8">
  <>
      {status === "sending" && <p>🔑 Logging in with UAE Pass…</p>}
      {status === "ok" && <p className="text-green-600">✅ Login successful, redirecting…</p>}
 
      {/* Restricted Access Popup */}
      {showErrorPopup && errorMessage === "restricted" && (
<div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-40 z-50">
<div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center relative">
<button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
>
              ✕
</button>
 
            <div className="flex justify-center mb-4">
<div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100">
<span className="text-3xl">🔒</span>
</div>
</div>
 
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Restricted Access
</h2> */}
 
            <p className="text-sm text-gray-600 mb-6">
              This service is only for registered users, please contact your
              Service Provider to access these services.
</p>
 
            <button
              className="bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700 w-full"
              onClick={handleClosePopup}
>
              Please Contact Admin
</button>
</div>
</div>
      )}
      {showErrorPopup && errorMessage === "newusercreated" && (
<div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-40 z-50">
<div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center relative">
<button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
>
              ✕
</button>
 
            <div className="flex justify-center mb-4">
<div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100">
<span className="text-3xl">🔒</span>
</div>
</div>
 
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {/* Restricted Access */}
</h2>
 
            <p className="text-sm text-gray-600 mb-6">
              Your data is registered, please contact your
              Service Provider to access these services.
</p>
 
            <button
              className="bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700 w-full"
              onClick={handleClosePopup}
>
              Please Contact Admin
</button>
</div>
</div>
      )}
 
      {/* Login Cancelled Popup */}
      {showErrorPopup && errorMessage === "cancelledOnApp" && (
<div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-40 z-50">
<div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center relative">
<button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
>
              ✕
</button>
 
            <div className="flex justify-center mb-4">
<div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100">
<span className="text-3xl text-red-500">✖</span>
</div>
</div>
 
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Login Cancelled
</h2>
 
            <p className="text-sm text-gray-600 mb-6">
              {/* You&apos;ve cancelled the login process. No worries — you can try again
              whenever you&apos;re ready. */}
              {/* You&apos;ve cancelled the login process. Please try again whenever you&apos;re ready. */}
              User cancelled the login.
</p>
 
            <button
              className="bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700 w-full"
              onClick={handleClosePopup}
>
              Continue Login
</button>
</div>
</div>
      )}
 
      {/* Other Errors Popup */}
      {/* {console.log("Show Error Popup:", showErrorPopup, "Error Message:", errorMessage)} */}
      {showErrorPopup && errorMessage !== "cancelledOnApp" && errorMessage !== "restricted" && (
<div className="fixed inset-0 flex items-center justify-center z-50">
<div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center relative">
<button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
>
              ✖
</button>
 
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
<span className="text-3xl text-red-500">⚠️</span>
</div>
 
            <h2 className="text-xl font-semibold mb-2">Login Failed</h2>
 
            <p className="text-gray-500 text-sm mb-6">
              Something went wrong during the login, please try again later!
</p>
 
            <button
              onClick={handleClosePopup}
              className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
>
              Try Again
</button>
</div>
</div>
      )}
      {showErrorPopup && errorMessage === "sop1userfound" && (
<div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-40 z-50">
<div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center relative">
<button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
>
              ✕
</button>
 
            <div className="flex justify-center mb-4">
<div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100">
<span className="text-3xl">🔒</span>
</div>
</div>
 
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Restricted Access
</h2> */}
 
            <p className="text-sm text-gray-600 mb-6">
             {/* The user account is SOP1, which is an unverified account. Please upgrade to SOP2/SOP3. */}
             You are not eligible to access this service. Your account is either not upgraded or you have a visitor account
</p>
 
            <button
              className="bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700 w-full"
              onClick={handleClosePopup}
>
              Please Contact Admin
</button>
</div>
</div>
      )}
      </>
</main>
  );
}