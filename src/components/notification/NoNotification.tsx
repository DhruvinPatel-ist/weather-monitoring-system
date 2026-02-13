import Image from "next/image";

export default function NoNotificationsPage() {
  return (
    <div className="h-full w-full bg-white1 rounded-lg shadow-sm p-4 flex justify-center items-center">
      <div className="mx-auto w-full h-full bg-white1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 flex h-54 w-54 items-center justify-center rounded-full bg-[#f1fcfd]">
            <Image
              src="/assets/notification/NoNotification.svg"
              alt="notification"
              width={300}
              height={300}
            />
          </div>
          <h2 className="mb-2 text-xl font-semibold">No Notification Yet</h2>
          <p className="text-gray-500">
            You&apos;ll see notifications here when they are available
          </p>
        </div>
      </div>
    </div>
  );
}
