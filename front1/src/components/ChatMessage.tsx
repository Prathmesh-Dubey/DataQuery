import AgentResponseCard from "./AgentResponseCard";
import { relativeTime } from "@/lib/format";
import type { ChatResponse, Message, User } from "@/lib/api";

interface Props {
  message: Message;
  payload?: ChatResponse | null;
  user: User | null;
}

export default function ChatMessage({ message, payload, user }: Props) {
  if (message.role === "user") {
    return (
      <div className="animate-fade-up flex justify-end gap-3">
        <div className="max-w-[80%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm dark:bg-white dark:text-black">
            {message.content}
          </div>
          <div className="mt-1 text-right text-[11px] text-slate-400 dark:text-neutral-500">
            {relativeTime(message.created_at)}
          </div>
        </div>
        {user?.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt={user.name}
            className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700 dark:bg-white/10 dark:text-white">
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <AgentResponseCard message={message} payload={payload} />
    </div>
  );
}
