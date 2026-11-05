
interface UserProfileProps {
  name?: string;
  role?: string;
}

export default function UserProfile({
  name = "Inventory User",
  role = "Employee",
}: UserProfileProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#668F98] p-3 text-white">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B8D5D7] font-semibold text-[#35636B]">
        {name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold">{name}</p>
        <p className="text-[10px]">{role}</p>
      </div>
    </div>
  );
}
