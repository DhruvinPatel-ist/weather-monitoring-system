// "use client";

// import { useEffect, useState } from "react";
// import {
//   getMessaging,
//   getToken,
//   onMessage,
//   deleteToken,
// } from "firebase/messaging";
// import { firebaseApp } from "@/lib/firebase";
// import { toast } from "sonner";

// export default function NotificationInit({
//   isLoggedIn,
// }: {
//   isLoggedIn: boolean;
// }) {
//   const [isSubscribed, setIsSubscribed] = useState(false);

//   useEffect(() => {
//     const messaging = getMessaging(firebaseApp);

//     const subscribe = async () => {
//       try {
//         const permission = await Notification.requestPermission();
//         if (permission !== "granted") {
//           // toast.warning("🔕 Notification permission blocked.");
//           return;
//         }

//         const token = await getToken(messaging, {
//           vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
//           serviceWorkerRegistration: await navigator.serviceWorker.register(
//             "/firebase-messaging-sw.js"
//           ),
//         });

//         if (!token) {
//           // toast.error("❌ Failed to get FCM token.");
//           return;
//         }

//         // console.log("✅ FCM Token:", token);

//         const res = await fetch(
//           "https://api-z3d6semtga-uc.a.run.app/api/subscribe",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ token, topic: "user_channel" }),
//           }
//         );

//         if (!res.ok) {
//           throw new Error("❌ Failed to subscribe API");
//         }

//         setIsSubscribed(true);
//         toast.success("🔔 Notifications enabled");

//         // Listen for foreground messages
//         onMessage(messaging, (payload) => {
//           // console.log("🔔 Foreground Notification:", payload);
//           const title =
//             payload?.data?.title ||
//             payload?.notification?.title ||
//             "Notification";
//           const body = payload?.data?.body || payload?.notification?.body || "";
//           toast(`${title}: ${body}`);
//         });
//       } catch (err) {
//         console.error("Firebase Messaging Init Error:", err);
//         toast.error("❌ Subscription failed");
//       }
//     };

//     const unsubscribe = async () => {
//       try {
//         const currentToken = await getToken(messaging);
//         if (currentToken) {
//           const success = await deleteToken(messaging);
//           if (success) {
//             // console.log("🛑 Unsubscribed from FCM");
//             setIsSubscribed(false);
//             // toast.info("🛑 Notifications disabled");
//           }
//         }
//       } catch (err) {
//         console.error("Unsubscribe error:", err);
//       }
//     };

//     if (isLoggedIn) {
//       if (!isSubscribed) subscribe();
//     } else {
//       if (isSubscribed) unsubscribe();
//     }
//   }, [isLoggedIn, isSubscribed]);

//   return null; // No UI
// }
