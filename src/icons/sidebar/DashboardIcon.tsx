export function DashboardIcon ({
    color="",
    className="",
}: {
    color?: string
    className?: string
}) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="10.9091" height="10.9091" rx="2.18182" fill={color} />
        <rect
          x="13.0908"
          width="10.9091"
          height="10.9091"
          rx="2.18182"
          fill={color}
        />
        <rect
          y="13.0908"
          width="10.9091"
          height="10.9091"
          rx="2.18182"
          fill={color}
        />
        <rect
          x="13.0908"
          y="13.0908"
          width="10.9091"
          height="10.9091"
          rx="2.18182"
          fill={color}
        />
      </svg>
    );
}