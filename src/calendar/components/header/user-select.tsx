import { useMemo } from "react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { AvatarGroup } from "@/components/ui/avatar-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UserSelect() {
  const { users, selectedUserId, setSelectedUserId } = useCalendar();

  const selectedUsers = useMemo(() => {
    if (selectedUserId === "all") return users;
    return users.filter(user => user.id === selectedUserId);
  }, [selectedUserId, users]);

  return (
    <div className="flex items-center gap-2">
      <AvatarGroup users={selectedUsers} />

      <Select value={selectedUserId} onValueChange={value => setSelectedUserId(value as typeof selectedUserId)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filtrar por responsável" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-xxs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{user.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
