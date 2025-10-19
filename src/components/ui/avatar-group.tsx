import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  users: { id: string; name: string; picturePath?: string | null }[];
  className?: string;
}

export function AvatarGroup({ users, className }: AvatarGroupProps) {
  const displayed = users.slice(0, 3);
  const remaining = users.length - displayed.length;

  return (
    <div className={cn("flex items-center", className)}>
      {displayed.map((user, index) => (
        <Avatar
          key={user.id}
          className={cn(
            "size-6 border-2 border-background text-[10px] font-medium",
            index !== 0 && "-ml-2"
          )}
        >
          <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}

      {remaining > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">+{remaining}</span>
      )}
    </div>
  );
}
