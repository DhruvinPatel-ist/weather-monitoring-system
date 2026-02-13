import WeatherDashboard from "@/components/Dashboard/weather-dashboard";
import MainLayout from "@/components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      {/* <div className="flex flex-col h-full max-w-7xl mx-auto"> */}
      <WeatherDashboard />
      {/* </div> */}
    </MainLayout>
  );
}
